So I just tried to create a file called "OSI and TCP/IP.md" When i pressed enter, it created a folder "OSI and TCP" and inside it, a file "IP.md"

7. Application Layer
8. Presentation Layer
9. Session Layer
10. Transport Layer
11. Network Layer
12. Data Link
13. Physical Layer

going down the stack is ENCAPSULATION
going up the stack is DECAPSULATION

ENCAPSULATION is very important ancd critical. It is getting the message from the sender to the receiver.

Layers 5,6,7 can be grouped. It is responsible for producing data for the transport layer

PDU - Protocol Data Unit - 10110010101

we identify 01 by file extension
jpg - picture/colour
exe - execute instructions

transport layer - addresses to identify the application of the service
what application is making the request and what service is receiving it.
applications make requests and services receive them.

port addresses is used to identify them. it will have a source and destination port address.

pdu calls transport layer segments. breaks data into smaller pieces.
why do we segment?

- security
- performance
- multiplexing: multiple communications to occur relatively at the same time.

so essentially there is the OSI model(7 layers) and the TCP/IP model(4 layers)
communication goes up and down each layer. the process of sending down is encapsulation which is where the message is sent from the sender to the receiver. the process of sending upward is decapsulation.
each layer sends a protocol data unit(pdu) which is data to the next layer and is instigated by a protocol.
OSI - Open Systems Interconnection Model
application layer
presentation layer
session layer - pdu is data. data is all 1s and 0s
transport layer - pdu is segment / protocol is tcp or udp
network layer - pdu is packets / protocol is IP
data link - pdu is frame / protocol is ethernet
physical layer - pdu is signal

TCP/IP - Transmission Control Protocol/Internet Protocol
application layer - a combination of layers 5,6,7 in OSI model
transport layer
internetwork layer
network access layer - a combination of layer 1,2 in OSI model

the data that is 1s and 0s is identified by their extension to determine what type of data it is. so, jpeg is image/colour, exe - executable, pdf - files.
we have ports to identify sender and receiver
we have network addresses to identify sender and receiver
they both have source and destination

applications make requests and services receive them

the physical layer is things you can see and touch, the cables amd modems.

how would this work in practice, sending images/messages on social media or emails or files. or how is a command executed? or even how we can use wifi via router vs using ethernet cable

--> stateful, session id, arp protocol, mac address
