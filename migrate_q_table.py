"""
Migrate Q-table from JSON to MongoDB
"""
import json
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()



# MongoDB configuration
MONGO_URI = os.getenv("MONGO_URI")
print(MONGO_URI)
DB_NAME = 'tic_tac_toe'
COLLECTION_NAME = 'q_table'

Q_TABLE_FILE = 'platform/rl/q_table.json'

def migrate_q_table():
    # Load from JSON
    if os.path.exists(Q_TABLE_FILE):
        with open(Q_TABLE_FILE, 'r') as f:
            q_table = json.load(f)
    else:
        print("No existing Q-table JSON file found.")
        return

    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # Clear existing data
    collection.delete_many({})

    # Insert data
    for state, actions in q_table.items():
        collection.insert_one({'state': state, 'actions': actions})

    print(f"Migrated {len(q_table)} states to MongoDB.")

    # Optionally backup and remove JSON file
    backup_file = Q_TABLE_FILE + '.backup'
    os.rename(Q_TABLE_FILE, backup_file)
    print(f"Backed up JSON file to {backup_file}")

if __name__ == '__main__':
    migrate_q_table()