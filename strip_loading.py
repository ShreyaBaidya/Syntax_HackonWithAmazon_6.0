import os

path = "frontend/src/app/page.tsx"
with open(path, "r") as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if line.startswith("function LoadingSkeleton() {"):
        start_idx = i
        break

if start_idx != -1:
    main_component = lines[:start_idx]
    
    # Add import
    imports = "import { LoadingSkeleton } from '@/components/LoadingSkeleton';\n"
    main_component.insert(21, imports)

    with open(path, "w") as f:
        f.writelines(main_component)

print("Split completed.")
