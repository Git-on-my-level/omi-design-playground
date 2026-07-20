const helloButton = document.querySelector('#hello-button');
const response = document.querySelector('#response');

helloButton.addEventListener('click', () => {
  response.textContent = 'Hello back. The prototype surface is working.';
  helloButton.textContent = 'Hello received';
});
