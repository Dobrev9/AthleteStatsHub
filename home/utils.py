# home/utils.py
import requests
from bs4 import BeautifulSoup
import time
import re # Import regex module for more robust name cleaning

def _normalize_name_for_filename(name):
    """
    Normalizes an athlete's name to match a filename format (lowercase, underscores).
    Example: "Ilia Topuria" -> "ilia_topuria"
             "Dricus Du Plessis" -> "dricus_du_plessis"
    """
    # Convert to lowercase
    normalized_name = name.lower()
    # Replace spaces and special characters with underscores
    # Keep only alphanumeric characters and underscores
    normalized_name = re.sub(r'[^a-z0-9]+', '_', normalized_name)
    # Remove leading/trailing underscores
    normalized_name = normalized_name.strip('_')
    return normalized_name

def get_ufc_pound_for_pound_rankings():
    """
    Fetches the Men's Pound-for-Pound rankings from UFC.com.
    Selectors are specifically tailored to the provided HTML structure.
    Also adds a 'filename' key to each fighter's dictionary.

    Returns:
        list: A list of dictionaries, where each dictionary represents an
              athlete with 'rank', 'name', and 'filename' keys.
              Returns an empty list if data cannot be fetched or parsed.
    """
    url = "https://www.ufc.com/rankings"
    rankings_data = []

    try:
        time.sleep(1) # Add a short delay

        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        view_groupings = soup.find_all('div', class_='view-grouping')

        p4p_section_found = False
        for group in view_groupings:
            header = group.find('div', class_='view-grouping-header')
            if header and "Pound-for-Pound" in header.get_text():
                p4p_section_found = True
                p4p_content = group.find('div', class_='view-grouping-content')
                
                if p4p_content:
                    rankings_table = p4p_content.find('table')
                    
                    if rankings_table:
                        rows = rankings_table.find('tbody').find_all('tr')
                        
                        for row in rows:
                            rank_element = row.find('td', class_='views-field-weight-class-rank')
                            rank = rank_element.text.strip() if rank_element else 'N/A'
                            
                            name_element = row.find('td', class_='views-field-title').find('a')
                            name = name_element.text.strip() if name_element else 'N/A'
                            
                            if rank != 'N/A' and name != 'N/A':
                                # Add the normalized filename and slug to the fighter dictionary
                                filename = _normalize_name_for_filename(name) + '.png'
                                rankings_data.append({'rank': rank, 'name': name, 'filename': filename, 'slug': _normalize_name_for_filename(name)})
                        break
                    else:
                        print("Pound-for-Pound table not found within content.")
                else:
                    print("Pound-for-Pound content div not found.")
            
        if not p4p_section_found:
            print("Pound-for-Pound section heading not found in any group.")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching UFC rankings (network/HTTP issue): {e}")
    except Exception as e:
        print(f"Error parsing UFC rankings (HTML structure issue): {e}")

    return rankings_data

# Removed the get_athlete_details function as you will create static pages manually
# def get_athlete_details(athlete_slug):
#     """
#     Fetches detailed information for a specific athlete from UFC.com.
#     ... (rest of the function) ...
#     """
#     pass # This function is removed
