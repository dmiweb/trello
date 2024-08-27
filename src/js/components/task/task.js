import "./task.css";

export default class Task {
  constructor(id, taskListId, text) {
    this.id = id;
    this.taskListId = taskListId;
    this.text = text;
  }
}
