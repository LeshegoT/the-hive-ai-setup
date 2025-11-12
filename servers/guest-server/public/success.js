const params = new URLSearchParams(window.location.search)
const p = (params.get('flow') || 'feedback');
const flow = p.charAt(0).toUpperCase() + p.slice(1);
document.getElementsByTagName('h1')[0].innerText = flow + ' Received';
document.getElementsByTagName('h3')[0].innerText = `Thank you for your ${flow}`;
