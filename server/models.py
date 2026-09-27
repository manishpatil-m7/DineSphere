"""
DineSphere - SQLAlchemy Database Models
Compatible with SQLite and PostgreSQL
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(String, default="CUSTOMER") # ADMIN, MANAGER, KITCHEN, CUSTOMER
    phone = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    points = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    dietary_pref = Column(String, default="none") # none, veg, vegan
    allergies = Column(Text, nullable=True)
    notify_email = Column(Boolean, default=True)
    notify_sms = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Dish(Base):
    __tablename__ = "dishes"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False) # Starters, Main Course, Desserts, Drinks
    price = Column(Integer, nullable=False) # Integer rupees
    is_veg = Column(Boolean, default=True)
    image_url = Column(String, nullable=True)
    rating = Column(Float, default=4.5)
    is_available = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="Placed") # Placed, Preparing, Ready, Served, Cancelled
    order_type = Column(String, nullable=False) # Dine-in, Takeaway, Delivery
    table_number = Column(Integer, nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    subtotal = Column(Integer, nullable=False)
    discount = Column(Integer, default=0)
    total = Column(Integer, nullable=False)
    coupon_code = Column(String, nullable=True)
    payment_method = Column(String, default="UPI") # UPI, Card, Cash
    payment_status = Column(String, default="Paid") # Paid, Pending
    points_earned = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    estimated_minutes = Column(Integer, default=25)
    cancel_reason = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    status_changed_by_admin = Column(Boolean, default=False)

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    dish_id = Column(String, ForeignKey("dishes.id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    note = Column(String, nullable=True)

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    guest_name = Column(String, nullable=True)
    guest_phone = Column(String, nullable=True)
    source = Column(String, default="online") # online, walk-in
    date = Column(String, nullable=False) # YYYY-MM-DD
    time_slot = Column(String, nullable=False)
    guests = Column(Integer, nullable=False)
    table_id = Column(String, ForeignKey("tables.id"), nullable=False)
    status = Column(String, default="Confirmed") # Confirmed, Seated, Completed, No-show, Cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

class DiningTable(Base):
    __tablename__ = "tables"

    id = Column(String, primary_key=True, default=generate_uuid)
    number = Column(Integer, unique=True, nullable=True)
    label = Column(String, unique=True, nullable=True)
    zone = Column(String, default="Regular") # Lounge, Window, Family, Regular
    seats = Column(Integer, nullable=False, default=4)
    fee = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    dish_id = Column(String, ForeignKey("dishes.id"), nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "dish_id", name="uq_user_dish_fav"),)

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    dish_id = Column(String, ForeignKey("dishes.id"), nullable=True)
    rating = Column(Integer, nullable=False) # 1-5
    comment = Column(Text, nullable=True)
    is_hidden = Column(Boolean, default=False)
    admin_reply = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    discount_percent = Column(Integer, nullable=False)
    min_order = Column(Integer, nullable=False)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    per_user_limit = Column(Integer, default=1)
    valid_from = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    audience = Column(String, nullable=True) # all, gold_and_above, inactive_30d
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="Open") # Open, Closed
    created_at = Column(DateTime, default=datetime.utcnow)

class TicketReply(Base):
    __tablename__ = "ticket_replies"

    id = Column(String, primary_key=True, default=generate_uuid)
    ticket_id = Column(String, ForeignKey("support_tickets.id"), nullable=False)
    author_role = Column(String, nullable=False) # admin, customer
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Address(Base):
    __tablename__ = "addresses"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    label = Column(String, nullable=False) # Home, Work, Other
    line1 = Column(String, nullable=False)
    city = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    is_default = Column(Boolean, default=False)

# ---------------------------------------------------------------------------
# Admin & Settings Models
# ---------------------------------------------------------------------------
class AdminAction(Base):
    __tablename__ = "admin_actions"

    id = Column(String, primary_key=True, default=generate_uuid)
    action = Column(String, nullable=False) # CREATE, UPDATE, DELETE, STATUS_CHANGE
    entity = Column(String, nullable=False) # Order, Dish, Inventory, Table, Reservation, etc.
    entity_id = Column(String, nullable=True)
    details = Column(Text, nullable=True) # JSON text
    created_at = Column(DateTime, default=datetime.utcnow)

class RestaurantSetting(Base):
    __tablename__ = "settings"

    id = Column(String, primary_key=True, default=generate_uuid)
    restaurant_name = Column(String, default="DineSphere Luxury Dining")
    phone = Column(String, default="+91 98765 43210")
    address = Column(Text, default="Palms Boulevard, Marine Drive, Mumbai")
    tax_percent = Column(Float, default=5.0)
    points_per_rupees = Column(Float, default=10.0)
    reservation_slots = Column(Text, default='["12:00", "13:30", "15:00", "18:30", "19:30", "20:30", "21:30"]')
    max_days_ahead = Column(Integer, default=14)
    hold_minutes = Column(Integer, default=5)
    cancel_window_hours = Column(Integer, default=2)
    max_tables_per_booking = Column(Integer, default=4)
    is_accepting_orders = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False)
    unit = Column(String, nullable=False) # kg, litre, piece
    quantity = Column(Float, default=0.0)
    low_threshold = Column(Float, default=5.0)
    cost_per_unit = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class DishIngredient(Base):
    __tablename__ = "dish_ingredients"

    id = Column(String, primary_key=True, default=generate_uuid)
    dish_id = Column(String, ForeignKey("dishes.id"), nullable=False)
    item_id = Column(String, ForeignKey("inventory_items.id"), nullable=False)
    qty_per_dish = Column(Float, nullable=False)

class TableBlock(Base):
    __tablename__ = "table_blocks"

    id = Column(String, primary_key=True, default=generate_uuid)
    table_id = Column(String, ForeignKey("tables.id"), nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    time_slot = Column(String, nullable=True) # None = whole day
    reason = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
