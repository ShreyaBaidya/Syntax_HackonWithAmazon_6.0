import os

path = "frontend/src/components/SharedCart/index.tsx"
with open(path, "r") as f:
    lines = f.readlines()

cart_row_start = -1
catalog_overlay_start = -1
for i, line in enumerate(lines):
    if line.startswith("function CartRow("):
        cart_row_start = i
    if line.startswith("const CATEGORIES = ["):
        catalog_overlay_start = i

if cart_row_start != -1 and catalog_overlay_start != -1:
    main_component = lines[:cart_row_start]
    catalog_overlay = lines[catalog_overlay_start:]

    # Add imports to main component
    imports = "import { CartRow } from './CartRow';\nimport { CatalogOverlay } from './CatalogOverlay';\n"
    main_component.insert(22, imports)

    with open(path, "w") as f:
        f.writelines(main_component)

    with open("frontend/src/components/SharedCart/CatalogOverlay.tsx", "w") as f:
        f.write("import React, { useState, useEffect, useRef } from 'react';\n")
        f.write("import { CartState, Product, searchProducts, getProductsByCategory, getRecommendations } from '@/lib/api';\n\n")
        f.writelines(catalog_overlay)

print("Split completed.")
