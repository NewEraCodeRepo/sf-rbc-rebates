// Helpers

function hide(element) {
  if (element) {
    element.style.display = 'none'
  }
}

function show(element) {
  if (element) {
    element.style.display = 'block';
  }
}

function eachElement(nodeList, callback) {
    const elementArray = Array.prototype.slice.call(nodeList);
    elementArray.forEach(callback);
}

// Behavior
const onReady = () => {
  const loggableForms = document.querySelectorAll('form[data-behavior="log"]');
  const log = document.querySelector('#log');
  const table = document.querySelector('table');
  const bulkCheckboxToggle = document.querySelector('#toggle-all-checkboxes');
  const idCheckboxes = document.querySelectorAll('input[name="ids[]"]');
  const deleteSelectedRowsButton = document.querySelector("#single-delete");
  const auth = document.querySelector('#l1').innerText;

  hide(log);

  // toggle all checkboxes
  if (bulkCheckboxToggle) {
    bulkCheckboxToggle.onchange = () => {
      const isChecked = bulkCheckboxToggle.checked;
      deleteSelectedRowsButton.disabled = !bulkCheckboxToggle.checked;
      eachElement(idCheckboxes, (checkbox) => checkbox.checked = isChecked);
    };
  }

  // disable delete buttons unless at least one checkbox is checked
  if (deleteSelectedRowsButton) {
    eachElement(idCheckboxes, (checkbox) => {
      checkbox.onchange = () => {
        deleteSelectedRowsButton.disabled = !checkbox.checked;
      };
    })
  }

  function registerLoggableForm(form) {
    // stream log form
    form.onsubmit = async (event) => {
      event.preventDefault();

      hide(table);

      let headers = new Headers();

      headers.set('Authorization', 'Basic ' + auth);

      const response = await fetch(form.action, { method: form.method, headers });
      const body = await response.text();

      show(log);
      log.textContent = body;
    };
  }

  eachElement(loggableForms, registerLoggableForm);
};

// add event listener only once to avoid leaks
document.addEventListener('DOMContentLoaded', onReady, false);

