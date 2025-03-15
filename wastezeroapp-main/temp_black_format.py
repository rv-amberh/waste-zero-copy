from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import firebase_admin
from firebase_admin import credentials, auth
from flask import Flask, request
from flask_cors import CORS  # Importing CORS
import random
import string
from datetime import datetime
from sqlalchemy import DateTime



# Initialize Flask app
app = Flask(__name__)
app.config.from_object('config.Config')
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})


# Step 1: Load the Firebase service account key
cred = credentials.Certificate("backend/wastezero-dcaba-firebase-adminsdk-fbsvc-ae5b36235d.json")
# Step 2: Initialize Firebase with the service account credentials
firebase_admin.initialize_app(cred)


# Initialize the SQLAlchemy database object
db = SQLAlchemy(app)

# Define the User model
# Define the Business model
#orders are in their own table and attached to a business id (organization that created it)

def generate_random_id(length=16):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

# Function to generate parsable date strings
def generate_available_until_datetime(time: int, date: int):
    return datetime(2025, 3, date, time, 0, 0).isoformat()

class Order(db.Model):
    #id of order
    id = db.Column(db.Integer, primary_key=True)
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
    volunteer_id = db.Column(db.String(120), db.ForeignKey('volunteer.id'))
    business_id = db.Column(db.Integer, db.ForeignKey('business.id'))

     # Relationships - makes sure each side is in sync so volunteer here is from Volunteer model and fills the orders on volunteer
    volunteer = db.relationship("Volunteer", back_populates="orders")
    business = db.relationship("Business", back_populates="orders")

    def __repr__(self):
        return f'<Order {self.id}>'

class Business(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.String(120), unique=True, nullable=False)  # Firebase UID
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    address = db.Column(db.String(200), nullable=True)
    business_type = db.Column(db.String(100), nullable=True)  # Extra field for business type

     # Relationships - makes sure each side is in sync so volunteer here is from Volunteer model and fills the orders on volunteer
    orders = db.relationship("Order", back_populates="business")

    def __repr__(self):
        return f'<Business {self.uid}>'

# Define the Volunteer model
class Volunteer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
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

def seed_orders():
    with app.app_context():
        if not Order.query.first():  # Check if there are existing orders
            initial_orders = [
                Order(id=generate_random_id(), organization_name="NeuroTech Solutions", status="NEW", pickup_city="Oakland", pickup_address="1347 Broadway, Oakland, CA", available_until_time=18, available_until_date=15, available_until=generate_available_until_datetime(15, 19)),
                Order(id=generate_random_id(), organization_name="Skyline Enterprises",status="NEW", pickup_city="San Francisco", pickup_address="1000 Market St, San Francisco, CA", available_until_time=16, available_until_date=16, available_until=generate_available_until_datetime(15, 19)),
                Order(id=generate_random_id(), organization_name="Innovative Systems Corp.",status="NEW", pickup_city="Oakland", pickup_address="5420 Telegraph Ave, Oakland, CA", available_until_time=12, available_until_date=17, available_until=generate_available_until_datetime(15, 19)),
                Order(id=generate_random_id(), organization_name="Quantum Innovations",status="NEW", pickup_city="San Francisco", pickup_address="250 Spear St, San Francisco, CA", available_until_time=19, available_until_date=18, available_until=generate_available_until_datetime(15, 19)),
                Order(id=generate_random_id(), organization_name="TechSphere Inc.", status="NEW",pickup_city="San Francisco", pickup_address="456 2nd St, San Francisco, CA", available_until_time=15, available_until_date=19, available_until=generate_available_until_datetime(15, 19)),
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
            'business_id': order.business_id,  # This links to a business
            'volunteer_id': order.volunteer_id , # This links to a volunteer
            'status': order.status,
            'available_until' : order.available_until
        } 
        for order in orders
    ])


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
          db.session.commit()

          if data["status"] == "CLAIMED" and data["volunteer_id"]:
              order.volunteer_id = data["volunteer_id"]
              db.session.commit()
    
          return jsonify({"message": "Order updated successfully", "order": order.status}), 200
      else:
        # If the order doesn't exist, return an error message
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

        # Call your function to add the volunteer to the DB
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





if __name__ == '__main__':
    app.run(debug=True)
   
