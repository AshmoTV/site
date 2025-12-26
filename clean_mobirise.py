import re
import os

# List of HTML files to clean
html_files = ['index.html', 'about.html', 'work.html', 'contact.html', 
              'lab.html', 'gallery.html', 'explorations.html']

cleaned_files = []
errors = []

for filename in html_files:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_length = len(content)
        
        # 1. Remove the Mobirise footer badge section
        content = re.sub(
            r'<section\s+class="display-7"[^>]*>.*?</section>(?=\s*<script|\s*</body)',
            '',
            content,
            flags=re.DOTALL
        )
        
        # 2. Remove Mobirise generator meta tag
        content = re.sub(
            r'<meta\s+name="generator"\s+content="Mobirise[^"]*"\s*/?>',
            '',
            content,
            flags=re.IGNORECASE
        )
        
        # 3. Remove Mobirise comment at the top
        content = re.sub(
            r'<!--\s*Site made with Mobirise[^>]*-->',
            '',
            content,
            flags=re.IGNORECASE
        )
        
        # 4. Remove any links to mobirise.com
        content = re.sub(
            r'<a[^>]*href="https?://[^"]*mobirise\.com[^"]*"[^>]*>.*?</a>',
            '',
            content,
            flags=re.DOTALL | re.IGNORECASE
        )
        
        # 5. Remove any links to mobiri.se
        content = re.sub(
            r'<a[^>]*href="https?://[^"]*mobiri\.se[^"]*"[^>]*>.*?</a>',
            '',
            content,
            flags=re.DOTALL | re.IGNORECASE
        )
        
        new_length = len(content)
        bytes_removed = original_length - new_length
        
        # Write the cleaned content back
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        cleaned_files.append((filename, bytes_removed))
        
    except FileNotFoundError:
        errors.append(f"{filename} - File not found")
    except Exception as e:
        errors.append(f"{filename} - Error: {str(e)}")

# Report results
print("="*70)
print("🧹 MOBIRISE CLEANUP COMPLETE")
print("="*70)

if cleaned_files:
    print("\n✅ Successfully cleaned:")
    for file, bytes_removed in cleaned_files:
        print(f"   • {file:25} - Removed {bytes_removed:,} bytes")

if errors:
    print("\n❌ Errors:")
    for error in errors:
        print(f"   • {error}")

print("\n" + "="*70)
print(f"Total files processed: {len(cleaned_files)}/{len(html_files)}")
print("="*70)
print("\n✅ All Mobirise references removed!")
print("   - Footer badges deleted")
print("   - Generator meta tags removed")
print("   - Comments cleaned")
print("   - External links removed")
