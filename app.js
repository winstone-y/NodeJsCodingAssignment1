const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

let db;

const dbpath = path.join(__dirname, "todoApplication.db");

const initializeDbAndServer = async () => {
  db = await open({
    filename: dbpath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => {
    console.log("Server Online");
  });
};

initializeDbAndServer();

const { format, isValid } = require("date-fns");

const priorityList = ["HIGH", "MEDIUM", "LOW"];
const categoryList = ["WORK", "HOME", "LEARNING"];
const statusList = ["TO DO", "IN PROGRESS", "DONE"];

const formattedDate = (dueDate) => {
  const newDate = format(new Date(dueDate), "yyyy-MM-dd");
  return newDate;
};

const convertDbObjectToResponseObject = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    category: object.category,
    priority: object.priority,
    status: object.status,
    dueDate: object.due_date,
  };
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSearchQ = (requestQuery) => {
  return requestQuery.search_q !== "";
};

const hasTodo = (requestQuery) => {
  return requestQuery.todo !== undefined;
};

const hasDueDate = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

// API 1
app.get("/todos/", async (request, response) => {
  const reqQuery = request.query;
  const { search_q = "", status, priority, category } = reqQuery;
  let query;

  if (hasPriorityAndStatus(reqQuery)) {
    if (priorityList.includes(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (statusList.includes(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      query = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`;
    }
  } else if (hasCategoryAndStatus(reqQuery)) {
    if (categoryList.includes(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (statusList.includes(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      query = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`;
    }
  } else if (hasCategoryAndPriority(reqQuery)) {
    if (priorityList.includes(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (categoryList.includes(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      query = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
    }
  } else if (hasStatus(reqQuery)) {
    if (statusList.includes(reqQuery.status)) {
      query = `SELECT * FROM todo WHERE  status = '${status}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (hasCategory(reqQuery)) {
    if (categoryList.includes(reqQuery.category)) {
      query = `SELECT * FROM todo WHERE category = '${category}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (hasPriority(reqQuery)) {
    if (priorityList.includes(reqQuery.priority)) {
      query = `SELECT * FROM todo WHERE priority = '${priority}';`;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (hasSearchQ(reqQuery)) {
    query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }
  const result = await db.all(query);
  const resultList = result.map((object) =>
    convertDbObjectToResponseObject(object)
  );
  response.send(resultList);
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoIdQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const result = await db.get(getSpecificTodoIdQuery);

  response.send(convertDbObjectToResponseObject(result));
});

// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  const getSpecificDueDateQuery = `SELECT * FROM todo WHERE 
    due_date='${formattedDate(date)}';`;

  const result = await db.all(getSpecificDueDateQuery);
  const resultList = result.map((object) =>
    convertDbObjectToResponseObject(object)
  );
  response.send(resultList);
});

// API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priorityList.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (categoryList.includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (statusList.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const createNewTodoQuery = `INSERT INTO todo 
    (id,todo,priority,status,category,due_date) VALUES 
    (${id},'${todo}','${priority}','${status}','${category}','${formattedDate(
      dueDate
    )}');`;
    await db.run(createNewTodoQuery);
    response.send("Todo Successfully Added");
  }
});

// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const reqQuery = request.body;

  const { category, status, priority, todo, dueDate } = reqQuery;

  let updateTodoQuery;

  if (hasStatus(reqQuery)) {
    if (statusList.includes(reqQuery.status)) {
      updateTodoQuery = `UPDATE todo SET 
      status = '${status}'  WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (hasCategory(reqQuery)) {
    if (categoryList.includes(reqQuery.category) !== false) {
      updateTodoQuery = `UPDATE todo SET 
      category = '${category}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (hasPriority(reqQuery)) {
    if (priorityList.includes(reqQuery.priority)) {
      updateTodoQuery = `UPDATE todo SET 
      priority = '${priority}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (hasTodo(reqQuery)) {
    updateTodoQuery = `UPDATE todo SET 
      todo = '${todo}' WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (hasDueDate(reqQuery)) {
    if (isValid(new Date(dueDate))) {
      updateTodoQuery = `UPDATE todo SET 
          due_date = '${formattedDate(dueDate)}' 
          WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

// API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
