import glob
import os
import rembg
from PIL import Image

def process_images():
    brain_dir = r"C:\Users\LENOVO\.gemini\antigravity\brain\75758f05-28e5-4d8f-9d0d-115eb1ba3811"
    
    # Process the new badges
    files_to_process = glob.glob(os.path.join(brain_dir, "badge_*.png"))
    
    print(f"Found {len(files_to_process)} badges to process.")
    
    for input_path in files_to_process:
        if "transparent" in input_path:
            continue
            
        filename = os.path.basename(input_path)
        # We just want the base prefix (e.g. badge_first_step) without timestamp if possible
        # but to keep it simple, let's just write to the assets folder!
        
        output_filename = filename.rsplit("_", 1)[0] + ".png" # removes the timestamp _178...
        
        output_path = os.path.join(r"C:\Users\LENOVO\Desktop\work\KHALA APPS\app-qader\assets\images", output_filename)
        
        print(f"Processing {filename} -> {output_filename}")
        
        try:
            with open(input_path, 'rb') as i:
                input_data = i.read()
                
            output_data = rembg.remove(input_data)
            
            with open(output_path, 'wb') as o:
                o.write(output_data)
        except Exception as e:
            print(f"Error processing {filename}: {e}")

process_images()
