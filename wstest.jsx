/** @jsx h */
import h from 'hyperscript';

class ChatMessage extends HTMLElement {
    connectedCallback() {
      const shadowRoot = this.attachShadow({mode: 'open'});
      shadowRoot.appendChild((
        <div>{this.message}</div>
      ));
    }    
  }
window.customElements.define('chat-message', ChatMessage);

function model(x)
{
    return new Proxy(x,  {
        get: function (oTarget, sKey) {
            console.log('get',arguments);
          return oTarget[sKey] || oTarget.getItem(sKey) || undefined;
        },
        set: function (oTarget, sKey, vValue) {
            console.log('set',arguments);
          if (sKey in oTarget) { return false; }
          return oTarget.setItem(sKey, vValue);
        },
        deleteProperty: function (oTarget, sKey) {
            console.log('deleteProperty',arguments);
          if (sKey in oTarget) { return false; }
          return oTarget.removeItem(sKey);
        },
        enumerate: function (oTarget, sKey) {
            console.log('enumerate',arguments);
          return oTarget.keys();
        },
        ownKeys: function (oTarget, sKey) {
            console.log('ownKeys',arguments);
          return oTarget.keys();
        },
        has: function (oTarget, sKey) {
            console.log('has',arguments);
          return sKey in oTarget || oTarget.hasItem(sKey);
        },
        defineProperty: function (oTarget, sKey, oDesc) {
            console.log('defineProperty',arguments);
          if (oDesc && 'value' in oDesc) { oTarget.setItem(sKey, oDesc.value); }
          return oTarget;
        },
        getOwnPropertyDescriptor: function (oTarget, sKey) {
            console.log('getOwnPropertyDescriptor',arguments);
          var vValue = oTarget.getItem(sKey);
          return vValue ? {
            value: vValue,
            writable: true,
            enumerable: true,
            configurable: false
          } : undefined;
        },
      });
}

const model = model({
    messages: []
});

model.messages.push(1);

function append(data)
{
    document
        .getElementById('messages')
        .appendChild((<chat-message {...data}></chat-message>));
}

var socket = new WebSocket("ws:///localhost:5000/SUPERMYCHANNEL17/ROOM999?ignoreMyself=true");
socket.addEventListener('message', function (event) {
    append({message: event.data});
});

document.getElementById('send')
    .addEventListener('click', function(e){
        var el = e.target.parentNode.querySelector("input");
        const data = el.value;
        socket.send(data);
        append({message: data});
    });