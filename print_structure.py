import os

def print_directory_structure(root_dir, prefix=""):
    for item in os.listdir(root_dir):
        path = os.path.join(root_dir, item)
        if os.path.isdir(path):
            # Skip the node_modules directory
            if item == "node_modules":
                continue
            print(f"{prefix}├── {item}/")
            print_directory_structure(path, prefix + "│   ")
        else:
            print(f"{prefix}├── {item}")

if __name__ == "__main__":
    project_root = "."  # Change this to your project root directory if needed
    print_directory_structure(project_root)