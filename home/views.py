# home/views.py
from django.shortcuts import render
from django.template.loader import get_template
from django.template import TemplateDoesNotExist
from bs4 import BeautifulSoup
import os
from django.conf import settings
from .utils import get_ufc_pound_for_pound_rankings, _normalize_name_for_filename
import re
from django.conf import settings

def extract_opponent_win_streaks_from_template(athlete_slug):
    """
    Extract opponent win streaks from athlete's HTML template file
    Updated to correctly parse the fight-result-card structure
    """
    # Convert slug to filename (e.g., 'ilia_topuria' -> 'ilia_topuria.html')
    template_filename = f"{athlete_slug}.html"
    template_path = os.path.join(settings.BASE_DIR, 'home', 'templates', 'home', template_filename)
    
    win_streaks = []
    
    try:
        with open(template_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # Parse HTML content
        soup = BeautifulSoup(content, 'html.parser')
        
        # Look for fight result cards
        fight_cards = soup.find_all(class_='fight-result-card')
        
        print(f"Found {len(fight_cards)} fight cards for {athlete_slug}")  # Debug print
        
        for i, card in enumerate(fight_cards):
            # Look for win streak information in fight-stats
            fight_stats = card.find(class_='fight-stats')
            if not fight_stats:
                continue
                
            # Find all stat items within this fight card
            stat_items = fight_stats.find_all(class_='stat-item')
            
            for item in stat_items:
                stat_label = item.find(class_='stat-label')
                stat_value = item.find(class_='stat-value')
                
                if (stat_label and stat_value and 
                    'win streak' in stat_label.get_text().lower()):
                    
                    streak_text = stat_value.get_text().strip()
                    print(f"Fight {i+1}: Found win streak text: '{streak_text}'")  # Debug print
                    
                    # Extract wins from patterns like "1-0", "3-0", "6-0", "11-0", "12-0"
                    match = re.search(r'(\d+)-\d+', streak_text)
                    if match:
                        wins = int(match.group(1))
                        win_streaks.append(wins)
                        print(f"Fight {i+1}: Extracted {wins} wins from '{streak_text}'")  # Debug print
                    break  # Found win streak for this fight, move to next fight
        
        print(f"Total win streaks extracted for {athlete_slug}: {win_streaks}")  # Debug print
        print(f"Sum of win streaks: {sum(win_streaks)}")  # Debug print
                        
    except FileNotFoundError:
        print(f"Template file not found: {template_path}")
        return [0]  # Return default if file not found
    except Exception as e:
        print(f"Error extracting win streaks for {athlete_slug}: {e}")
        return [0]
        
    return win_streaks if win_streaks else [0]

def calculate_total_opponent_win_streak(athlete_slug):
    """
    Calculate total opponent win streak for an athlete
    """
    win_streaks = extract_opponent_win_streaks_from_template(athlete_slug)
    total_wins = sum(win_streaks)
    total_fights = len([streak for streak in win_streaks if streak > 0])  # Only count fights with actual streaks
    
    # If no valid streaks found, show 0
    if total_fights == 0:
        total_fights = len(win_streaks) if win_streaks else 1
    
    return {
        'display': f"{total_wins}-0 ({total_fights} fights)",
        'numeric': total_wins,
        'breakdown': win_streaks
    }

def get_athletes_with_win_streaks():
    """
    Get all athletes with their calculated opponent win streaks
    """
    # Get all athletes from templates and add win streak data
    athletes_data = get_all_athletes_for_comparison()
    
    # Add opponent win streak data to each athlete
    for athlete in athletes_data:
        win_streak_data = calculate_total_opponent_win_streak(athlete['slug'])
        athlete['opponent_win_streak'] = win_streak_data
    
    return athletes_data

def get_all_athletes_for_comparison():
    """
    Automatically discovers all athlete templates and extracts their data
    """
    athletes_data = []
    templates_dir = os.path.join(settings.BASE_DIR, 'home', 'templates', 'home')
    
    # Get all HTML files in the templates directory (excluding index.html and other non-athlete files)
    if os.path.exists(templates_dir):
        for filename in os.listdir(templates_dir):
            if filename.endswith('.html') and filename not in ['index.html', 'base.html', 'athlete_not_found.html']:
                athlete_slug = filename.replace('.html', '')
                athlete_data = extract_athlete_data_from_template(athlete_slug)
                if athlete_data:
                    athletes_data.append(athlete_data)
    
    return athletes_data

def extract_athlete_data_from_template(athlete_slug):
    """
    Extracts athlete data from their HTML template file
    Updated to correctly parse record-display and stat-card elements
    """
    try:
        template_path = f'home/{athlete_slug}.html'
        template = get_template(template_path)
        
        # Read the raw template content
        template_file_path = os.path.join(settings.BASE_DIR, 'home', 'templates', 'home', f'{athlete_slug}.html')
        
        if not os.path.exists(template_file_path):
            return None
            
        with open(template_file_path, 'r', encoding='utf-8') as file:
            html_content = file.read()
        
        # Parse the HTML content
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extract athlete name (from h1 with class 'athlete-name')
        name_element = soup.find('h1', class_='athlete-name')
        if not name_element:
            name_element = soup.find('h1')
        if not name_element:
            name_element = soup.find('title')
        
        athlete_name = name_element.get_text().strip() if name_element else athlete_slug.replace('_', ' ').title()
        
        # Extract record from record-display section
        record_data = {}
        record_display = soup.find(class_='record-display')
        if record_display:
            record_items = record_display.find_all(class_='record-item')
            for item in record_items:
                # Extract label and number from record item
                label_elem = item.find(class_='record-label')
                number_elem = item.find(class_='record-number')
                
                if label_elem and number_elem:
                    label = label_elem.get_text().strip().lower()
                    value = extract_number(number_elem.get_text().strip())
                    
                    # Map record labels to standardized keys
                    if 'win' in label:
                        record_data['wins'] = value
                    elif 'loss' in label or 'lose' in label:
                        record_data['losses'] = value
                    elif 'draw' in label:
                        record_data['draws'] = value
        
        # Extract stats from stat-card elements
        stats_data = {}
        stat_cards = soup.find_all(class_='stat-card')
        for card in stat_cards:
            # Extract stat label and number
            label_elem = card.find(class_='stat-label')
            number_elem = card.find(class_='stat-number')
            
            if label_elem and number_elem:
                stat_name = label_elem.get_text().strip()
                stat_value = number_elem.get_text().strip()
                stats_data[stat_name] = stat_value
        
        # Extract nationality if available
        nationality_elem = soup.find(class_='nationality')
        nationality = nationality_elem.get_text().strip() if nationality_elem else ''
        
        # Extract nickname if available
        nickname_elem = soup.find(class_='athlete-nickname')
        nickname = nickname_elem.get_text().strip() if nickname_elem else ''
        
        # Construct image path
        image_path = f'home/images/athlete_chests/{athlete_slug}.png'
        
        return {
            'name': athlete_name,
            'slug': athlete_slug,
            'image': image_path,
            'record': record_data,
            'stats': stats_data,
            'nationality': nationality,
            'nickname': nickname
        }
        
    except (TemplateDoesNotExist, FileNotFoundError, Exception) as e:
        print(f"Error extracting data for athlete {athlete_slug}: {e}")
        return None

def extract_number(text):
    """
    Extracts the first number from a text string, handles percentages and decimals
    """
    import re
    # Look for numbers with optional decimal places and percentage signs
    match = re.search(r'(\d+(?:\.\d+)?)', text)
    if match:
        num_str = match.group(1)
        # Return as float if it has decimal places, otherwise as int
        return float(num_str) if '.' in num_str else int(num_str)
    return 0

def home_view(request):
    ufc_rankings = get_ufc_pound_for_pound_rankings()
    
    # Ensure slug is added for each fighter in ufc_rankings
    for fighter in ufc_rankings:
        fighter['slug'] = _normalize_name_for_filename(fighter['name'])
    
    # Get all athletes for comparison with win streak data
    all_athletes_for_comparison = get_athletes_with_win_streaks()
    
    context = {
        'all_athletes_for_comparison': all_athletes_for_comparison,
        'ufc_rankings': ufc_rankings,
    }
    return render(request, 'home/index.html', context)

def athlete_profile_view(request, athlete_slug):
    template_name = f'home/{athlete_slug}.html'
    # You can add more context here if needed for the athlete's specific page
    context = {
        'athlete_slug': athlete_slug,
    }
    # It's good practice to handle cases where the template might not exist
    try:
        return render(request, template_name, context)
    except Exception as e: # Catch a broader exception for template loading issues
        # For debugging, print the error. In production, render a custom 404 page.
        print(f"Error loading template {template_name}: {e}")
        return render(request, 'home/athlete_not_found.html', {'athlete_slug': athlete_slug}, status=404)