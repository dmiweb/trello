import "./task-board.css";
import Task from "../task/task";

export default class TaskBoard {
  constructor(parentEl, formAddTask) {
    this.parentEl = parentEl;
    this.formAddTask = formAddTask;
    this.taskBuffer = [];
    this.dragElement = undefined;

    this.showFormAddTask = this.showFormAddTask.bind(this);
    this.removeFormAddTask = this.removeFormAddTask.bind(this);
    this.addTask = this.addTask.bind(this);
    this.removeTask = this.removeTask.bind(this);
    this.onGrabTask = this.onGrabTask.bind(this);
    this.onDradTask = this.onDradTask.bind(this);
    this.onDropTask = this.onDropTask.bind(this);
  }

  static get markup() {
    return `
      <div class="task-board">
        <div class="task-board__column task-column">
          <h2 class="task-column__title">Todo</h2>
          <ul id="1" class="task-column__task-list"></ul>
          <button class="task-column__add-task-btn">Add another card</button>
        </div>
        <div class="task-board__column task-column">
          <h2 class="task-column__title">In progress</h2>
          <ul id="2" class="task-column__task-list"></ul>
          <button class="task-column__add-task-btn">Add another card</button>
        </div>
        <div class="task-board__column task-column">
          <h2 class="task-column__title">Done</h2>
          <ul id="3" class="task-column__task-list"></ul>
          <button class="task-column__add-task-btn">Add another card</button>
        </div>
      </div>
    `;
  }

  static get selector() {
    return ".task-board";
  }

  static get taskColumnSelector() {
    return ".task-board__column";
  }

  static get taskListSelector() {
    return ".task-column__task-list";
  }

  static get taskAddButtonSelector() {
    return ".task-column__add-task-btn";
  }

  bindToDOM() {
    this.parentEl.innerHTML = TaskBoard.markup;

    this.element = this.parentEl.querySelector(TaskBoard.selector);
    this.taskColumnElements = this.element.querySelectorAll(
      TaskBoard.taskColumnSelector
    );
    this.taskListElements = this.element.querySelectorAll(
      TaskBoard.taskListSelector
    );
    this.taskAddButtonElement = this.element.querySelector(
      TaskBoard.taskAddButtonSelector
    );

    this.element.addEventListener("click", this.showFormAddTask);
    this.element.addEventListener("click", this.removeFormAddTask);
    this.element.addEventListener("click", this.addTask);
    this.element.addEventListener("click", this.removeTask);
    this.element.addEventListener("mousedown", this.onGrabTask);
  }

  showFormAddTask(e) {
    const currentElement = e.target;
    const column = currentElement.closest(TaskBoard.taskColumnSelector);

    if (currentElement.classList.contains("task-column__add-task-btn")) {
      currentElement
        .closest(TaskBoard.taskColumnSelector)
        .insertAdjacentHTML("beforeEnd", this.formAddTask);

      column.querySelector(".form-add-task__text").focus();

      currentElement.remove();
    }
  }

  removeFormAddTask(e) {
    const currentElement = e.target;

    if (currentElement.classList.contains("form-add-task__cancel-btn")) {
      const column = currentElement.closest(TaskBoard.taskColumnSelector);
      const form = currentElement.closest(".form-add-task");

      form.remove();

      column.insertAdjacentHTML(
        "beforeEnd",
        '<button class="task-column__add-task-btn">Add another card</button>'
      );
    }
  }

  renderTask(listId, taskId, text) {
    return `
      <li id="${taskId}" class="task" data-column="${listId}">
        <span class="task__text">${text}</span>
        <div class="task__delete-btn">&#215;</div>
      </li>
    `;
  }

  addTask(e) {
    e.preventDefault();
    const currentElement = e.target;

    if (currentElement.classList.contains("form-add-task__add-btn")) {
      const column = currentElement.closest(TaskBoard.taskColumnSelector);
      const taskList = column.querySelector(".task-column__task-list");
      const form = currentElement.closest(".form-add-task");
      const text = form.querySelector(".form-add-task__text").value;
      const id = performance.now();
      const correctText = text.trim();

      if (correctText) {
        const task = new Task(id, taskList.id, correctText);

        this.taskBuffer.push(task);

        column.insertAdjacentHTML(
          "beforeEnd",
          '<button class="task-column__add-task-btn">Add another card</button>'
        );

        form.remove();

        this.saveTasks();
        this.reloadTaskList();
      }
    }
  }

  removeTask(e) {
    const currentElement = e.target;
    const currentTask = currentElement.closest(".task");

    if (currentElement.classList.contains("task__delete-btn")) {
      this.taskBuffer = this.taskBuffer.filter(
        (task) => +currentTask.id !== task.id
      );

      currentTask.remove();

      this.saveTasks();
      this.reloadTaskList();
    }
  }

  reloadTaskList() {
    this.taskBuffer = this.restoreSaveTasks();

    if (!this.taskBuffer) this.taskBuffer = [];
    if (!this.taskBuffer.length) {
      this.taskListElements.forEach((list) =>
        list.insertAdjacentHTML(
          "beforeEnd",
          '<span class="no-tasks-message">No cards</span>'
        )
      );
      return;
    }

    this.taskListElements.forEach((list) => {
      list.innerHTML = "";

      this.taskBuffer.forEach((task) => {
        const taskElement = this.renderTask(
          task.taskListId,
          task.id,
          task.text
        );

        if (list.id === task.taskListId) {
          list.insertAdjacentHTML("beforeEnd", taskElement);
        }
      });
    });
  }

  restoreSaveTasks() {
    try {
      return JSON.parse(localStorage.getItem("saveTasks"));
    } catch (e) {
      return null;
    }
  }

  saveTasks() {
    localStorage.setItem("saveTasks", JSON.stringify(this.taskBuffer));
  }

  onGrabTask(e) {
    this.dragElement = e.target;

    if (this.dragElement.classList.contains("task")) {
      this.shiftX = e.clientX - this.dragElement.getBoundingClientRect().left;
      this.shiftY = e.clientY - this.dragElement.getBoundingClientRect().top;

      this.dragElement.style.top = e.pageY - this.shiftY + "px";
      this.dragElement.style.left = e.pageX - this.shiftX + "px";
      this.dragElement.style.width = this.dragElement.offsetWidth - 25 + "px";
      this.dragElement.classList.add("dragged");

      const shadowElement = this.getShadowElement(this.dragElement);
      this.dragElement.insertAdjacentElement("beforeBegin", shadowElement);

      document.documentElement.addEventListener("mouseup", this.onDropTask);
      document.documentElement.addEventListener("mousemove", this.onDradTask);
    }
  }

  onDradTask(e) {
    const belowElement = this.getBelowElement(e, this.dragElement);
    const shadowElement = this.getShadowElement(this.dragElement);

    this.dragElement.style.top = e.pageY - this.shiftY + "px";
    this.dragElement.style.left = e.pageX - this.shiftX + "px";

    if (belowElement.classList.contains("task")) {
      if (document.querySelector(".dragged-shadow"))
        document.querySelector(".dragged-shadow").remove();

      if (this.element.querySelector(".dragged-shadow")) return;

      belowElement.insertAdjacentElement("beforeBegin", shadowElement);
    }

    if (
      belowElement.classList.contains("task-column__add-task-btn") ||
      belowElement.classList.contains("form-add-task")
    ) {
      if (document.querySelector(".dragged-shadow"))
        document.querySelector(".dragged-shadow").remove();

      if (this.element.querySelector(".dragged-shadow")) return;

      const column = belowElement.closest(TaskBoard.taskColumnSelector);
      const taskList = column.querySelector(".task-column__task-list");

      taskList.insertAdjacentElement("beforeEnd", shadowElement);
    }
  }

  onDropTask(e) {
    const belowElement = this.getBelowElement(e, this.dragElement);
    const currentTaskList = belowElement.closest(".task-column__task-list");

    const sortBuffer = [];

    if (belowElement.classList.contains("dragged-shadow")) {
      currentTaskList.insertBefore(this.dragElement, belowElement);
    }

    if (document.querySelector(".dragged-shadow"))
      document.querySelector(".dragged-shadow").remove();

    this.taskBuffer.forEach((task) => {
      if (!currentTaskList) return;

      if (
        task.id === +this.dragElement.id &&
        task.taskListId !== currentTaskList.id
      ) {
        task.taskListId = currentTaskList.id;
      }
    });

    const taskElements = document.querySelectorAll(".task");

    taskElements.forEach((elem) => {
      this.taskBuffer.forEach((task) => {
        if (+elem.id === task.id) {
          sortBuffer.push(task);
        }
      });
    });

    this.taskBuffer = sortBuffer;

    this.dragElement.classList.remove("dragged");
    this.dragElement.removeAttribute("style");
    this.dragElement = undefined;

    document.documentElement.removeEventListener("mouseup", this.onDropTask);
    document.documentElement.removeEventListener("mousemove", this.onDradTask);

    this.saveTasks();
    this.reloadTaskList();
  }

  getBelowElement(event, element) {
    element.hidden = true;
    const belowElement = document.elementFromPoint(
      event.clientX,
      event.clientY
    );
    element.hidden = false;

    return belowElement;
  }
  getShadowElement(element) {
    const shadowElement = document.createElement("li");
    shadowElement.classList.add("dragged-shadow");
    shadowElement.style.width = element.offsetWidth + "px";
    shadowElement.style.height = element.offsetHeight + "px";

    return shadowElement;
  }
}
