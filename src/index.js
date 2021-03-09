const express = require('express');
const cors = require('cors');
const { v4: uuid, validate } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function findUserByUsername(username) {
  return users.find(u => u.username === username);
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = findUserByUsername(username);
  if(!user) return response.status(400).json({error: 'User not found.'});
  request.user = user;
  next();
}

function checksAlreadyExistsUsername(request, response, next) {
  const { username } = request.body;
  if(findUserByUsername(username)) return response.status(400).json({error: 'Username already exists.'});
  next();
}

function checksExistsTodoById(request, response, next) {
  const {id} = request.params;
  const { username } = request.headers;
  const user = findUserByUsername(username);
  const index = user.todos.findIndex(t => t.id === id);
  if(index < 0) return response.status(404).json({error: 'Todo not found'});
  request.index = index;
  next();
}

app.post('/users', checksAlreadyExistsUsername, (request, response) => {
  const {name, username} = request.body;

  const user = {
    id: uuid(),
    name,
    username,
    todos:[]
  };
  users.push(user);

  return response.status(201).json(user);
});

app.use(checksExistsUserAccount);
app.get('/todos', (request, response) => {
  return response.json(request.user.todos);
});

app.post('/todos', (request, response) => {
  const {title, deadline} = request.body;

  const todo = {
    id: uuid(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }
  request.user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsTodoById, (request, response) => {
  const { title, deadline } = request.body;
  const { user, index } = request;
  const todo = user.todos[index];

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch('/todos/:id/done', checksExistsTodoById, (request, response) => {
  const { user, index } = request;
  const todo = user.todos[index];
  todo.done = true;
  return response.status(201).json(todo);
});

app.delete('/todos/:id', checksExistsTodoById, (request, response) => {
  const { user, index } = request;
  user.todos.splice(index, 1);
  return response.status(204).send();
});

module.exports = app;