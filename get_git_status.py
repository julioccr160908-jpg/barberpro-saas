import subprocess
import os

def run_command(command):
    result = subprocess.run(command, capture_output=True, text=True, shell=True)
    return result.stdout

if __name__ == "__main__":
    print("Git Status Porcelain:")
    print(run_command("git status --porcelain"))
    print("\nGit Status -uall Porcelain:")
    print(run_command("git status -uall --porcelain"))
