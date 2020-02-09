import App from './App.svelte'

const socket = {
  on () {
  }
}


const app = new App({
  target: document.getElementById('demo'),
  data: {
    name: 'world'
  },
  props: {
    socket
  }
});
