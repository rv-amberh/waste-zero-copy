import firebase_admin
from firebase_admin import credentials, auth

# Step 1: Load the Firebase service account key
cred = credentials.Certificate("backend/wastezero-dcaba-firebase-adminsdk-fbsvc-ae5b36235d.json")
# Step 2: Initialize Firebase with the service account credentials
firebase_admin.initialize_app(cred)

# List all users
def list_all_users():
    # try block
    try:
        # Start with the first batch of users, get list from auth istance 
        users = auth.list_users()

        # Iterate through users and print their UID
        for user in users.users:
            print(f"UID: {user.uid}, Email: {user.email}, Phone: {user.phone_number}")
    #catch 
    except Exception as e:
        print(f"Error fetching users: {e}")

list_all_users()

#setup users in my backend with sql and their id 

