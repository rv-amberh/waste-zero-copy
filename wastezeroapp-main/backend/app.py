from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import firebase_admin
from firebase_admin import credentials, auth
from flask_cors import CORS  
import random
import string
from datetime import datetime
from sqlalchemy import DateTime
import os
from openai import OpenAI
from dotenv import load_dotenv
from models import db, Message
from datetime import datetime
from textblob import TextBlob
import nltk
import emoji

nltk.download('movie_reviews')
nltk.download('punkt')


# Initialize Flask app
app = Flask(__name__)
app.config.from_object('config.Config')
CORS(app, resources={r"/*": {"origins": "https://wastezeroapp-tn59-rv-amberhs-projects.vercel.app"}}, supports_credentials=True)

load_dotenv()

db = SQLAlchemy()

db.init_app(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Step 1: Load the Firebase service account key
cred = credentials.Certificate(".//wastezero-dcaba-firebase-adminsdk-fbsvc-ae5b36235d.json")
# Step 2: Initialize Firebase with the service account credentials
firebase_admin.initialize_app(cred)

# Define the User model
# Define the Business model
#orders are in their own table and attached to a business id (organization that created it)

def generate_random_id(length=16):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

# Function to generate parsable date strings
def generate_available_until_datetime(time: int, date: int):
    return datetime(2025, 3, date, time, 0, 0).isoformat()


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.String(50), nullable=False)
    sender = db.Column(db.String(50), nullable=False)


    def __repr__(self):
        return f"<Message {self.id}>"


class Order(db.Model):
    #id of order
    id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    #org_name (Google, Salesforce)
    organization_name = db.Column(db.String(120), nullable=False)
    pickup_city = db.Column(db.String(120), nullable=False)
    pickup_address = db.Column(db.String(120), nullable=False)
    dropoff_city = db.Column(db.String(120))
    dropoff_address = db.Column(db.String(120))
    available_until_time = db.Column(db.Integer, nullable=False)
    available_until_date = db.Column(db.Integer, nullable=False)
    available_until = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(120))

    # Foreign keys for volunteer and business - to associate id with id on each obj
    volunteer_id = db.Column(db.Integer, db.ForeignKey('volunteer.id'))

     # Relationships - makes sure each side is in sync so volunteer here is from Volunteer model and fills the orders on volunteer
    volunteer = db.relationship("Volunteer", back_populates="orders")

    def __repr__(self):
        return f'<Order {self.id}>'

class Business(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    uid = db.Column(db.String(120), unique=True, nullable=False)  # Firebase UID
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    address = db.Column(db.String(200), nullable=True)
    business_type = db.Column(db.String(100), nullable=True)  # Extra field for business type

     # Relationships - makes sure each side is in sync so volunteer here is from Volunteer model and fills the orders on volunteer

    def __repr__(self):
        return f'<Business {self.uid}>'

# Define the Volunteer model
class Volunteer(db.Model):
    id = db.Column(db.Integer, autoincrement=True,primary_key=True)
    uid = db.Column(db.String(120), unique=True, nullable=False)  # Firebase UID
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=True)

    orders = db.relationship("Order", back_populates="volunteer")

   
    def __repr__(self):
        return f'<Volunteer {self.uid}>'
    

###
# Helper functions
###
    
# add user to database
def add_volunteer_to_db(uid, email, name):
    existing_volunteer = Volunteer.query.filter_by(uid=uid).first()
    if existing_volunteer:
        print("User exists already.")
        return jsonify({"uid": "existing_volunteer.uid"}), 200
    
    new_volunteer = Volunteer(
         uid=uid,
         email=email,
         name=name or "Default"
    )
    
    db.session.add(new_volunteer)
    db.session.commit()
    print(f"Volunteer {name} added to the database.")
    return "User added successfully", 200

# Function to analyze sentiment and adjust the response
def get_sentiment(message):
    blob = TextBlob(message)
    sentiment = blob.sentiment.polarity  # Range is -1 (negative) to 1 (positive)
    return sentiment

def adjust_tone_for_sentiment(sentiment, ai_reply):
    
    # Positive sentiment range
    if sentiment > 0.75:
        ai_reply = f"Here's the information you requested: {ai_reply}. Let me know if you need any additional details."
    elif sentiment > 0.5:
        ai_reply = f"Here's what I found for you: {ai_reply}. Feel free to ask if you'd like more information."
    elif sentiment > 0.2:
        ai_reply = f"Here's the info: {ai_reply}. Let me know if you need anything else."

    # Negative sentiment range
    elif sentiment < -0.75:
        ai_reply = f"I'm sorry to hear that. Here's the information: {ai_reply}. Let me know if I can assist you further."
    elif sentiment < -0.5:
        ai_reply = f"I understand this may be frustrating. Here's what I found: {ai_reply}. I'm here to help if you need anything."
    elif sentiment < -0.2:
        ai_reply = f"I see things may not be going as planned. Here's the information: {ai_reply}. Let me know if you'd like more assistance."

    # Neutral sentiment
    else:
        ai_reply = f"Here's the information: {ai_reply}. Let me know if you need anything else."

    return ai_reply



def seed_orders():
    with app.app_context():
        if not Order.query.first():  # Check if there are existing orders
            initial_orders = [
                Order(organization_name="NeuroTech Solutions", status="NEW", pickup_city="Oakland", pickup_address="1347 Broadway, Oakland, CA", available_until_time=18, available_until_date=15, available_until=generate_available_until_datetime(15, 19)),
                Order(organization_name="Skyline Enterprises",status="NEW", pickup_city="San Francisco", pickup_address="1000 Market St, San Francisco, CA", available_until_time=16, available_until_date=16, available_until=generate_available_until_datetime(15, 19)),
                Order(organization_name="Innovative Systems Corp.",status="NEW", pickup_city="Oakland", pickup_address="5420 Telegraph Ave, Oakland, CA", available_until_time=12, available_until_date=17, available_until=generate_available_until_datetime(15, 19)),
                Order(organization_name="Quantum Innovations",status="NEW", pickup_city="San Francisco", pickup_address="250 Spear St, San Francisco, CA", available_until_time=19, available_until_date=18, available_until=generate_available_until_datetime(15, 19)),
                Order(organization_name="TechSphere Inc.", status="NEW",pickup_city="San Francisco", pickup_address="456 2nd St, San Francisco, CA", available_until_time=15, available_until_date=19, available_until=generate_available_until_datetime(15, 19)),
                ]           

            db.session.bulk_save_objects(initial_orders)
            db.session.commit()
            print("Orders seeded successfully.")


# Initialize the database and create tables
with app.app_context():
    db.create_all()
    seed_orders();
    print("Database tables created!")
    print(db.Model.metadata.tables)

@app.route('/')
def home():
    return "Hello, Flask is running!"

#create an order 
@app.route('/create_order', methods=['OPTIONS', 'POST'])
def create_order():
    if request.method == 'OPTIONS':
        return '', 200  # Just respond with an empty 200 status
     
    data = request.get_json()  # Parse the incoming JSON data

    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    
    new_order = Order(
        organization_name=data['organization_name'],
        pickup_city=data['pickup_city'],
        pickup_address=data['pickup_address'],
        available_until_time=data['available_until_time'],
        available_until_date=data['available_until_date'],
        available_until=generate_available_until_datetime(data['available_until_time'], data['available_until_date']),
        status=data['status']
    )

    db.session.add(new_order)
    db.session.commit()

    return jsonify({"message": "Order created!"}), 201

@app.route('/get_orders', methods=['OPTIONS', 'GET'])
def get_orders():
    if request.method == "OPTIONS":
        response = jsonify({"message": "CORS Preflight Passed"})
        response.headers.add("Access-Control-Allow-Origin", "https://wastezeroapp-tn59-rv-amberhs-projects.vercel.app")
        response.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200
   
    orders = Order.query.all()
    
    return jsonify([
        {
            'id': order.id,  
            'organization_name': order.organization_name,
            'pickup_city': order.pickup_city,
            'pickup_address': order.pickup_address,
            'dropoff_city': order.dropoff_city,
            'dropoff_address': order.dropoff_address,
            'available_until_time': order.available_until_time,
            'available_until_date': order.available_until_date,
            'volunteer_id': order.volunteer_id, # This links to a volunteer
            'status': order.status,
            'available_until' : order.available_until
        } 
        for order in orders
    ])

#get_conversation by id
@app.route('/api/messages/<user_id>', methods=['OPTIONS', 'GET'])
def get_messages(user_id):
    if request.method == "OPTIONS":
        response = jsonify({"message": "CORS Preflight Passed"})
        response.headers.add("Access-Control-Allow-Origin", "https://wastezeroapp-tn59-rv-amberhs-projects.vercel.app")
        response.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200
   
    try:
        # Query the database for messages belonging to the given user_id
        messages = Message.query.filter_by(user_id=user_id).all()

        # Serialize the messages
        messages_data = [{"id": msg.id, "message": msg.message, "created_at": msg.created_at, "sender": msg.sender} for msg in messages]

        return jsonify({"messages": messages_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
#sync users between firebase auth and SQLLite 
@app.route('/sync_users')
def sync_users():
    try:
        volunteers = auth.list_users().iterate_all()

        for volunteer in volunteers:
            print(volunteer, "vol")
            add_volunteer_to_db(volunteer.uid, volunteer.email, "")
            print(f"Syncing volunteer: {volunteer.uid}")
        return "Volunteers synced successfully!", 200

    except Exception as e:
        return f"Error: {e}!", 500

@app.route('/update_order', methods=["POST", "OPTIONS"])
def update_order():
      if request.method == 'OPTIONS':
        return '', 200  # Just respond with an empty 200 status
     
      data = request.get_json()  # Parse the incoming JSON data
      print(data, "data")
      if not data:
        return jsonify({"error": "Invalid JSON"}), 400

      order_id = data.get('order_id')
      order = db.session.get(Order, order_id)

      if order:
        order.status = data["status"]

        volunteer_id = data.get("volunteer_id")  # Using .get to avoid KeyError

        if volunteer_id and order.volunteer_id is None:
          order.volunteer_id = volunteer_id
        
        db.session.commit()
        return jsonify({"message": "Order updated successfully", "order": order.status}), 200
      else:
        return jsonify({"error": "Order not found"}), 404

      

#ADD VOLUNTEER

@app.route('/add_volunteer', methods=['OPTIONS', 'POST'])
def add_volunteer():
    if request.method == 'OPTIONS':
        return '', 200  # Just respond with an empty 200 status
     
    try:    
        data = request.get_json()
        print("data", data)
        uid = data.get('uid')
        email = data.get('email')
        name = data.get('displayName')  # Using displayName or name

        add_volunteer_to_db(uid, email, name)
        return jsonify({"message": "Volunteer added successfully!"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

# get users from db and prting them 
@app.route('/get_volunteers')
def get_volunteers():
    volunteers = Volunteer.query.all()
    return jsonify([{'uid': volunteer.uid, 'email': volunteer.email} for volunteer in volunteers])


@app.route('/api/chat', methods=['POST'])
def chat():
    if request.method == "OPTIONS":
        response = jsonify({"message": "CORS Preflight Passed"})
        response.headers.add("Access-Control-Allow-Origin", "https://wastezeroapp-tn59-rv-amberhs-projects.vercel.app")
        response.headers.add("Access-Control-Allow-Methods", "OPTIONS", "POST")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response, 200
    
    user_message = request.json.get('message')
    user_id = request.json.get('userId')
    created_at = request.json.get('createdAt')

    if not user_message:
        return jsonify({"error": "Message is required"}), 400
    
    new_message = Message(user_id=user_id, created_at=created_at, message=user_message, sender="user")
    db.session.add(new_message)
    db.session.commit()
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": user_message}]
            )
        
        ai_reply = response.choices[0].message.content
          
        sentiment_score = get_sentiment(ai_reply)
        print(f"Sentiment Score: {sentiment_score}")  #debugging     
        ai_reply_with_adjusted_tone = adjust_tone_for_sentiment(sentiment_score, ai_reply)

        # ai_reply_with_emoji = add_emoji_based_on_sentiment(ai_reply)

        assistant_created_at = datetime.now().isoformat()
        assistant_message = Message(user_id=user_id, message=ai_reply_with_adjusted_tone, created_at=assistant_created_at, sender="assistant")
        db.session.add(assistant_message)
        db.session.commit()
         
        return jsonify({"reply": ai_reply, "assistant_created_at": assistant_created_at})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
   
