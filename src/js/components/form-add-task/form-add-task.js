import "./form-add-task.css";

export default class FormAddTask {
  constructor() {}

  static get markup() {
    return `
      <form class="form-add-task">
        <textarea class="form-add-task__text" placeholder="Enter a title for this card..."></textarea>
        <button class="form-add-task__add-btn">Add Card</button>
        <div class="form-add-task__cancel-btn">&#215;</div>
      </form>
    `;
  }
}
