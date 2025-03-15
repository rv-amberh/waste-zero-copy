from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.String(50), nullable=False)
    sender = db.Column(db.String(50), nullable=False)


    def __repr__(self):
        return f"<Message {self.id}>"
