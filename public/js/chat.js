const socket = io()




const $messageform = document.querySelector('#message-form')
const $messageformInput = $messageform.querySelector('input')
const $messageformButton = $messageform.querySelector('button')
const $messages = document.querySelector('#messages')
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationmsgTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}
const {username, room} = Qs.parse(location.search,{ ignoreQueryPrefix: true})
socket.on('message', (msg) => {
    console.log(msg)
    const html = Mustache.render(messageTemplate,{
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})
socket.on('locationmsg',(msg) =>{
    console.log(msg)
    const html = Mustache.render(locationmsgTemplate,{
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomdata',({room,users}) =>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageform.addEventListener('submit',(e) =>{
    e.preventDefault()
    $messageformButton.setAttribute('disabled','disabled')
    const msg = e.target.elements.message.value
    socket.emit('sendmessage',msg, (error) =>{
        $messageformButton.removeAttribute('disabled')
        $messageformInput.value = ' '
        $messageformInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message delivered')
    })
})

const $sendlocation = document.querySelector('#send-location')
$sendlocation.addEventListener('click',() =>{
    if(!navigator.geolocation){
        return alert('Your browser wont support geolocation')
    }
    $sendlocation.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) =>{
        
        socket.emit('send-location',{latitude: position.coords.latitude,longitude: position.coords.longitude},() =>{
            $sendlocation.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
    
})

socket.emit('join',{username,room},(error) =>{
    if(error){
        alert(error)
        location.href ='/'
    }

})

