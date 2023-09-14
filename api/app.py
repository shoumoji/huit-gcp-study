import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db_host = os.environ.get("POSTGRES_HOST", "db")
db_user = os.environ.get("POSTGRES_USER", "postgres")
db_password = os.environ.get("POSTGRES_USER", "password")
db_database = os.environ.get("POSTGRES_DB", "todo_db")

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{db_user}:{db_password}@{db_host}:5432/{db_database}'
CORS(app)
db = SQLAlchemy(app)
migrate = Migrate(app, db)

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(64), index=True)

@app.route('/todo', methods=['POST'])
def add_todo():
    content = request.json.get('content')
    todo = Todo(content=content)
    db.session.add(todo)
    db.session.commit()
    return jsonify({'id': todo.id, 'content': todo.content})

@app.route('/todo/<int:todo_id>', methods=['GET'])
def get_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    return jsonify({'id': todo.id, 'content': todo.content})

@app.route('/todo/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    content = request.json.get('content')
    todo.content = content
    db.session.commit()
    return jsonify({'id': todo.id, 'content': todo.content})

@app.route('/todo/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    db.session.delete(todo)
    db.session.commit()
    return '', 204

@app.route('/todo/list', methods=['GET'])
def get_todo_list():
    todos = Todo.query.all()
    return jsonify([{'id': todo.id, 'content': todo.content} for todo in todos])

if __name__ == '__main__':
    app.run(debug=True)
