const express = require("express");
const app = express();
module.exports = app;
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let db;

const dbPath = path.join(__dirname, "todoApplication.db");

// Initialize Database and Server

const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Online");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initDbAndServer();

// priority and status scenarios

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

// API 1

app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  const {
    search_q = "",
    priority = "",
    status = "",
    category = "",
  } = request.query;

  if (hasPriorityAndStatusProperties(request.query)) {
    getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
  } else if (hasCategoryAndStatusProperties(request.query)) {
    getTodosQuery = `
     SELECT
      *
     FROM
      todo
     WHERE
      todo LIKE '%${search_q}%'
      AND status = '${status}' AND category='${category}';`;
  } else if (hasCategoryAndPriorityProperties(request.query)) {
    getTodosQuery = `
     SELECT
      *
     FROM
      todo
     WHERE
      todo LIKE '%${search_q}%'
      AND priority = '${priority}' AND category='${category}';`;
  } else if (hasCategoryProperty(request.query)) {
    getTodosQuery = `
     SELECT
      *
     FROM
      todo
     WHERE
      todo LIKE '%${search_q}%'
      AND category='${category}';`;
  } else if (hasStatusProperty(request.query)) {
    getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    status = '${status}';`;
  } else if (hasPriorityProperty(request.query)) {
    getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE 
   priority = '${priority}';`;
  } else {
    getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE 
    todo LIKE '%${search_q}%';`;
  }
  const convertDbObjectToResponseObject = (object) => {
    return {
      id: `${object.id}`,
      todo: `${object.todo}`,
      priority: `${object.priority}`,
      status: `${object.status}`,
      category: `${object.category}`,
      dueDate: `${object.due_date}`,
    };
  };
  const result = await db.all(getTodosQuery);
  const resultList = result.map((t) => convertDbObjectToResponseObject(t));
  response.send(resultList);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  let getTodosQuery = "";
  const { todoId } = request.params;

  const getSpecificTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const convertDbObjectToResponseObject = (object) => {
    return {
      id: `${object.id}`,
      todo: `${object.todo}`,
      priority: `${object.priority}`,
      status: `${object.status}`,
      category: `${object.category}`,
      dueDate: `${object.due_date}`,
    };
  };
  const result = await db.get(getSpecificTodoQuery);
  response.send(convertDbObjectToResponseObject(result));
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const createNewTodoQuery = `INSERT INTO todo(id,todo,category,priority,
      status,due_date) VALUES (${id},'${todo}','${category}',
      '${priority}','${status}','${dueDate}')`;

  if (status === undefined) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priority === undefined) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (category === undefined) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dueDate === undefined) {
    response.status(400);
    response.send("Invalid Todo Due Date");
  } else {
    await db.run(createNewTodoQuery);
    response.send("Todo Successfully Added");
  }
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let updateTodoQuery;
  if (status !== undefined) {
    updateTodoQuery = `UPDATE todo SET status ='${status}';`;
    await db.run(updateTodoQuery);
    response.send("Status Updated");
  } else if (priority !== undefined) {
    updateTodoQuery = `UPDATE todo SET priority ='${priority}';`;
    await db.run(updateTodoQuery);
    response.send("Priority Updated");
  } else if (todo !== undefined) {
    updateTodoQuery = `UPDATE todo SET todo ='${todo}';`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    updateTodoQuery = `UPDATE todo SET category ='${category}';`;
    await db.run(updateTodoQuery);
    response.send("Category Updated");
  } else if (dueDate !== undefined) {
    updateTodoQuery = `UPDATE todo SET due_date ='${dueDate}';`;
    await db.run(updateTodoQuery);
    response.send("Due Date Updated");
  }
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
