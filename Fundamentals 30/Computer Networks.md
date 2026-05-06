From Essentials of Computer Networks

--> "The goal of Computer Network is to make all physical and logical resources (i.e. printer, scanner, program, and data) available to anyone on the network irrespective of geographical location." see OSI for physical and logical devices. what does logical mean here?

OSI Model

- how communication occurs between two devices
- how communication occurs between application and server
- how are emails sent across the internet?

does data go down to the physical layer of device A and then into the physical layer of device B and makes it's way upwards to the application layer of device B? =>
The complete round trip:
Your Device Server
Floor 7 ── GET request ──> Floor 7 (server reads the request, prepares HTML)
Floor 6 Floor 6
Floor 5 Floor 5
Floor 4 Floor 4
Floor 3 Floor 3
Floor 2 Floor 2
Floor 1 ════════════════════ Floor 1

Floor 7 <── HTML response ── Floor 7 (your browser reads the HTML)
Floor 6 Floor 6
Floor 5 Floor 5
Floor 4 Floor 4
Floor 3 Floor 3
Floor 2 Floor 2
Floor 1 ════════════════════ Floor 1
So there are actually two full descents and two full ascents for a single GET request:

Your Floor 7 → your Floor 1 → server's Floor 1 → server's Floor 7
Server's Floor 7 → server's Floor 1 → your Floor 1 → your Floor 7

data link layer: here error checking and detecting is carried out to ensure accuracy of original message
is the session layer essentially concerned with sessions, session ID in the web browser?
