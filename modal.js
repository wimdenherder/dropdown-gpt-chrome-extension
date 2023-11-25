function showModal(textOrObservable, callback) {
  // Create elements
  if(document.querySelector('.dropdownModal')) return; // Prevent multiple modals
  const modal = document.createElement('div');
  modal.classList.add('dropdownModal');
  const content = document.createElement('div');
  const message = document.createElement('p');
  const yesButton = document.createElement('button');
  const noButton = document.createElement('button');

  // Apply styles
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark background
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  });
  
  Object.assign(content.style, {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    width: '300px',
    maxWidth: '80%',
    textAlign: 'center'
  });
  
  Object.assign(yesButton.style, {
    backgroundColor: 'lightgreen',
    marginRight: '10px',
    padding: '5px 10px'
  });
  yesButton.textContent = 'YES';
  
  Object.assign(noButton.style, {
    backgroundColor: 'lightcoral',
    padding: '5px 10px'
  });
  noButton.textContent = 'NO';
  

  // Add text
  if(typeof textOrObservable === 'string') {
    message.textContent = textOrObservable;
  } else {
    observable.subscribe((value) => {
      message.textContent = value;
  });
  }

  // Add click events
  modal.addEventListener('click', () => {
      modal.remove();
  });

  content.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  yesButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering of background click event
      modal.remove();
      callback(true);
  });

  noButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering of background click event
      modal.remove();
      callback(false);
  });

  // Add elements to DOM
  content.appendChild(message);
  content.appendChild(yesButton);
  content.appendChild(noButton);
  modal.appendChild(content);
  document.body.appendChild(modal);
}

// Example usage:
let observable = new Observable();
showModal(observable, function(response) {
    if (response) {
        console.log("User clicked YES");
    } else {
        console.log("User clicked NO");
    }
});
observable.update("Do you want to continue?");
setTimeout(() => observable.update("Are you sure?"), 2000);