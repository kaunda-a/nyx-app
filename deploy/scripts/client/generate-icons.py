#!/usr/bin/env python3
"""
Generate icon files for Tauri application from SVG source.
Creates ICO, PNG, and BMP files for installer branding.
"""

import os
import sys
from pathlib import Path
import subprocess
import tempfile

def create_nyx_logo_svg(size=256):
    """Create Nyx spider logo SVG with specified size."""
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="{size}" height="{size}">
  <defs>
    <style>
      .spider-body {{ 
        stroke: #6366F1; 
        fill: none; 
        stroke-width: 1.5;
      }}
      .spider-eye {{ 
        fill: #6366F1; 
      }}
      .spider-legs {{
        stroke: #6366F1;
        fill: none;
        stroke-width: 1.5;
      }}
    </style>
  </defs>
  
  <!-- Main body - hexagon -->
  <path d="M12 4L18 8V16L12 20L6 16V8L12 4Z" class="spider-body"/>
  
  <!-- Spider legs -->
  <g class="spider-legs">
    <!-- Left legs -->
    <path d="M6 12L3 9"/>
    <path d="M6 12L2 12"/>
    <path d="M6 12L3 15"/>
    
    <!-- Right legs -->
    <path d="M18 12L21 9"/>
    <path d="M18 12L22 12"/>
    <path d="M18 12L21 15"/>
  </g>
  
  <!-- Eyes -->
  <circle cx="10" cy="12" r="1" class="spider-eye"/>
  <circle cx="14" cy="12" r="1" class="spider-eye"/>
</svg>'''

def create_installer_banner_svg():
    """Create installer banner with Nyx branding."""
    return '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 164 314" width="164" height="314">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2d2d2d;stop-opacity:1" />
    </linearGradient>
    <style>
      .banner-bg { fill: url(#bgGradient); }
      .logo-main { 
        stroke: #6366F1; 
        fill: none; 
        stroke-width: 2;
      }
      .logo-eye { 
        fill: #6366F1; 
      }
      .brand-text {
        fill: #ffffff;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-weight: bold;
      }
      .brand-subtitle {
        fill: #cccccc;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 12px;
      }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="164" height="314" class="banner-bg"/>
  
  <!-- Nyx Logo (centered) -->
  <g transform="translate(82, 120)">
    <!-- Main body - hexagon -->
    <path d="M0 -16L12 -8V8L0 16L-12 8V-8L0 -16Z" class="logo-main"/>
    
    <!-- Spider legs -->
    <g class="logo-main">
      <!-- Left legs -->
      <path d="M-12 0L-18 -6"/>
      <path d="M-12 0L-20 0"/>
      <path d="M-12 0L-18 6"/>
      
      <!-- Right legs -->
      <path d="M12 0L18 -6"/>
      <path d="M12 0L20 0"/>
      <path d="M12 0L18 6"/>
    </g>
    
    <!-- Eyes -->
    <circle cx="-4" cy="0" r="1.5" class="logo-eye"/>
    <circle cx="4" cy="0" r="1.5" class="logo-eye"/>
  </g>
  
  <!-- Brand Text -->
  <text x="82" y="160" text-anchor="middle" class="brand-text" font-size="24">Nyx</text>
  <text x="82" y="180" text-anchor="middle" class="brand-subtitle">Admin Interface</text>
  
  <!-- Version info area -->
  <text x="82" y="280" text-anchor="middle" class="brand-subtitle">Professional Edition</text>
</svg>'''

def generate_icon_files():
    """Generate all required icon files for the installer."""
    try:
        # Get project paths
        script_dir = Path(__file__).parent
        project_root = script_dir.parent.parent.parent
        icons_dir = project_root / "client" / "src-tauri" / "icons"
        
        print(f"Generating icons in: {icons_dir}")
        
        # Ensure icons directory exists
        icons_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate main icon SVG
        icon_svg_path = icons_dir / "icon.svg"
        with open(icon_svg_path, 'w', encoding='utf-8') as f:
            f.write(create_nyx_logo_svg(256))
        print(f"✓ Created: {icon_svg_path}")
        
        # Generate installer banner SVG
        banner_svg_path = icons_dir / "installer-banner.svg"
        with open(banner_svg_path, 'w', encoding='utf-8') as f:
            f.write(create_installer_banner_svg())
        print(f"✓ Created: {banner_svg_path}")

        # Create a simple BMP placeholder for NSIS
        create_simple_bmp(icons_dir / "installer-banner.bmp")
        print(f"✓ Created: installer-banner.bmp")

        # Create a simple ICO file
        create_simple_ico(icons_dir / "icon.ico")
        print(f"✓ Created: icon.ico")
        
        # Try to convert SVG to other formats if tools are available
        try_convert_icons(icons_dir)
        
        print("✓ Icon generation completed successfully!")
        return True
        
    except Exception as e:
        print(f"✗ Error generating icons: {e}")
        return False

def create_simple_bmp(bmp_path):
    """Create a simple BMP file for NSIS installer banner."""
    try:
        # Create a simple 164x314 BMP with Nyx branding
        width, height = 164, 314

        # BMP header (54 bytes) + pixel data
        # Simple 24-bit BMP format
        file_size = 54 + (width * height * 3)

        # BMP file header (14 bytes)
        bmp_header = bytearray([
            0x42, 0x4D,  # "BM" signature
            *file_size.to_bytes(4, 'little'),  # File size
            0x00, 0x00, 0x00, 0x00,  # Reserved
            0x36, 0x00, 0x00, 0x00   # Offset to pixel data
        ])

        # DIB header (40 bytes)
        dib_header = bytearray([
            0x28, 0x00, 0x00, 0x00,  # Header size
            *width.to_bytes(4, 'little'),   # Width
            *height.to_bytes(4, 'little'),  # Height
            0x01, 0x00,  # Planes
            0x18, 0x00,  # Bits per pixel (24)
            0x00, 0x00, 0x00, 0x00,  # Compression
            0x00, 0x00, 0x00, 0x00,  # Image size
            0x13, 0x0B, 0x00, 0x00,  # X pixels per meter
            0x13, 0x0B, 0x00, 0x00,  # Y pixels per meter
            0x00, 0x00, 0x00, 0x00,  # Colors used
            0x00, 0x00, 0x00, 0x00   # Important colors
        ])

        # Create gradient background (dark theme)
        pixel_data = bytearray()
        for y in range(height):
            for x in range(width):
                # Create a dark gradient
                intensity = int(26 + (y / height) * 20)  # 26-46 range
                pixel_data.extend([intensity, intensity, intensity])  # BGR format

        # Write BMP file
        with open(bmp_path, 'wb') as f:
            f.write(bmp_header)
            f.write(dib_header)
            f.write(pixel_data)

    except Exception as e:
        print(f"Warning: Could not create BMP file: {e}")

def create_simple_ico(ico_path):
    """Create a simple ICO file with Nyx spider logo."""
    try:
        # Create a 32x32 icon with simple spider design
        size = 32

        # ICO file header (6 bytes)
        ico_header = bytearray([
            0x00, 0x00,  # Reserved
            0x01, 0x00,  # Type (1 = icon)
            0x01, 0x00   # Number of images
        ])

        # Icon directory entry (16 bytes)
        ico_dir_entry = bytearray([
            size,        # Width
            size,        # Height
            0x00,        # Color count (0 = >256 colors)
            0x00,        # Reserved
            0x01, 0x00,  # Planes
            0x20, 0x00,  # Bits per pixel (32)
            0x00, 0x00, 0x00, 0x00,  # Image size (will be calculated)
            0x16, 0x00, 0x00, 0x00   # Offset to image data
        ])

        # Create 32x32 RGBA pixel data with spider design
        pixel_data = bytearray()
        center_x, center_y = size // 2, size // 2

        for y in range(size):
            for x in range(size):
                # Default transparent
                r, g, b, a = 0, 0, 0, 0

                # Draw spider body (hexagon-like shape)
                dx, dy = x - center_x, y - center_y
                if abs(dx) <= 6 and abs(dy) <= 6:
                    if abs(dx) + abs(dy) <= 8:
                        r, g, b, a = 99, 102, 241, 255  # Nyx purple

                # Draw spider legs (simplified)
                if y == center_y:  # Horizontal legs
                    if x < center_x - 6 or x > center_x + 6:
                        r, g, b, a = 99, 102, 241, 255

                if abs(dx) == abs(dy) and abs(dx) > 6:  # Diagonal legs
                    r, g, b, a = 99, 102, 241, 255

                # Eyes
                if (dx == -2 and dy == 0) or (dx == 2 and dy == 0):
                    r, g, b, a = 99, 102, 241, 255

                pixel_data.extend([b, g, r, a])  # BGRA format

        # Update image size in directory entry
        image_size = len(pixel_data)
        ico_dir_entry[8:12] = image_size.to_bytes(4, 'little')

        # Write ICO file
        with open(ico_path, 'wb') as f:
            f.write(ico_header)
            f.write(ico_dir_entry)
            f.write(pixel_data)

    except Exception as e:
        print(f"Warning: Could not create ICO file: {e}")

def try_convert_icons(icons_dir):
    """Try to convert SVG icons to other formats using available tools."""
    icon_svg = icons_dir / "icon.svg"
    
    # Try different conversion methods
    conversion_methods = [
        try_inkscape_conversion,
        try_imagemagick_conversion,
        try_cairosvg_conversion
    ]
    
    for method in conversion_methods:
        if method(icon_svg, icons_dir):
            print("✓ Successfully converted SVG to other formats")
            return True
    
    print("⚠ Could not convert SVG to other formats - SVG will be used directly")
    return False

def try_inkscape_conversion(svg_path, output_dir):
    """Try converting using Inkscape."""
    try:
        # Check if Inkscape is available
        subprocess.run(['inkscape', '--version'], 
                      capture_output=True, check=True)
        
        # Convert to ICO (256x256)
        ico_path = output_dir / "icon.ico"
        subprocess.run([
            'inkscape', str(svg_path),
            '--export-type=png',
            '--export-width=256',
            '--export-height=256',
            '--export-filename', str(ico_path.with_suffix('.png'))
        ], check=True)
        
        # Convert PNG to ICO if possible
        png_path = ico_path.with_suffix('.png')
        if png_path.exists():
            # Rename to ICO (basic conversion)
            png_path.rename(ico_path)
        
        return True
        
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def try_imagemagick_conversion(svg_path, output_dir):
    """Try converting using ImageMagick."""
    try:
        # Check if ImageMagick is available
        subprocess.run(['magick', '--version'], 
                      capture_output=True, check=True)
        
        # Convert to ICO
        ico_path = output_dir / "icon.ico"
        subprocess.run([
            'magick', str(svg_path),
            '-resize', '256x256',
            str(ico_path)
        ], check=True)
        
        return True
        
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def try_cairosvg_conversion(svg_path, output_dir):
    """Try converting using cairosvg Python library."""
    try:
        import cairosvg
        from PIL import Image
        import io
        
        # Convert SVG to PNG
        png_data = cairosvg.svg2png(url=str(svg_path), output_width=256, output_height=256)
        
        # Save as ICO
        ico_path = output_dir / "icon.ico"
        image = Image.open(io.BytesIO(png_data))
        image.save(ico_path, format='ICO', sizes=[(256, 256)])
        
        return True
        
    except ImportError:
        return False
    except Exception:
        return False

def main():
    """Main entry point."""
    print("🎨 Nyx Icon Generator")
    print("=" * 40)
    
    success = generate_icon_files()
    
    if success:
        print("\n✅ All icons generated successfully!")
        print("\nGenerated files:")
        print("  • icon.svg - Main application icon")
        print("  • installer-banner.svg - Installer branding")
        print("  • icon.ico - Windows icon (if conversion available)")
    else:
        print("\n❌ Icon generation failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
