import os

def print_directory_structure(root_dir, prefix=""):
    for item in os.listdir(root_dir):
        path = os.path.join(root_dir, item)
        if os.path.isdir(path):
            # Skip the node_modules directory
            if item == "node_modules":
                continue
            if item == "__pycache__":
                continue
            if item == ".git":
                continue
            if item == ".vscode":
                continue
            if item == ".idea":
                continue
            if item == ".DS_Store":
                continue
            print(f"{prefix}├── {item}/")
            print_directory_structure(path, prefix + "│   ")
        else:
            print(f"{prefix}├── {item}")

if __name__ == "__main__":
    project_root = "."  # Change this to your project root directory if needed
    print_directory_structure(project_root)