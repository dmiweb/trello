import TaskBoard from "./components/task-board/task-board";
import FormAddTask from "./components/form-add-task/form-add-task";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");

  const taskBoard = new TaskBoard(container, FormAddTask.markup);
  taskBoard.bindToDOM();
  taskBoard.reloadTaskList();
});
