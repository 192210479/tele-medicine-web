import os
import sys

# Add D:\TELEM to path
sys.path.append(r'D:\TELEM')

from app import app, db
from models import Doctor

with app.app_context():
    # Update all doctors who have 0 reviews to have a rating of 0.0
    updated = Doctor.query.filter_by(reviews_count=0).update({Doctor.rating: 0.0})
    db.session.commit()
    print(f"Updated {updated} doctors.")
