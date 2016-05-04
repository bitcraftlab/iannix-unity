
// the IP of Iannix (127.0.0.1 if testing locally)
public var RemoteIP : String = "127.0.0.1"; 

// the port IanniX is listening on
public var RemotePort : int = 1234; 

// the port that Unity is listening on
public var LocalPort : int = 57120; 

// drag the game objects onto the list, and set the first cursor id as it appears inside IanniX
public var firstCursorID : int = 0;
public var cursors : GameObject[];

// drag the game objects onto the list, and set the first trigger id as it appears inside IanniX
public var firstTriggerID : int = 2000;
public var triggers : GameObject[];


// mapping iannix ids to coordinates and trigger values
private var cursorCoord : Vector3[];
private var triggerCoord : Vector3[];
private var triggerValue: float[];

// the OSC object
private var osc : Osc;
private var udp : Udp;

// set this to true to print out the OSC messages
public var debug : boolean = false;


public function Start ()
{

	cursorCoord = new Vector3[cursors.length];
	triggerCoord = new Vector3[triggers.length];
	triggerValue = new float[triggers.length];

	//Initializes on start up to listen for messages
	//make sure this game object has both UDPPackIO and OSC script attached

	Debug.Log("Connecting to IanniX via UDP.");

	udp = GetComponent("Udp");
	udp.init(RemoteIP, RemotePort, LocalPort);

	osc = GetComponent("Osc");
	osc.init(udp);
	osc.SetAllMessageHandler(AllMessageHandler);

}


function Update () {

	// Debug.Log("Update.");

	// update position and rotation of all cursors
	for(var i = 0; i < cursors.length; i++) {

		// look ahead
		cursors[i].transform.LookAt(cursorCoord[i]);

		// update position
		cursors[i].transform.position = cursorCoord[i];	

	}

	// update position and scaling of all triggers
	for(i = 0; i < triggers.length; i++) {

		// update position
		triggers[i].transform.position = triggerCoord[i];

		// linear fall-off to zero
		var t = triggerValue[i];
		triggerValue[i] = Mathf.Max(t - 0.01, 0);

		// scale the object to match the trigger value
		triggers[i].transform.localScale = new Vector3(t, t, t);

	}

}


function OnDisable()
{
    // close UDP socket of the listener

    Debug.Log("Closing UDP socket");

    osc.Cancel();
    osc = null;

}


// custom logger. 
// Turn this on or off using the debug toggle.
public function log(msg : String) {
	if(debug === true) { 
		Debug.Log(msg);
	}
}


public function AllMessageHandler(msg: OscMessage){

	// log the OSC message
	log(osc.OscMessageToString(msg));

	// message parameters
	var address = msg.Address;
	var values = msg.Values;

	// variables to hold the dataa
	var id : int;
	var group_id : String;

	var x : float;
	var y : float;
	var z : float;

	var x_world : float;
	var y_world : float;
	var z_world : float;

	// index of our world objects
	var i : int;

	// different actions, based on the address pattern
	switch (address){

		// FORMAT:  /cursor id group_id x y z x_world y_world z_world 
		case "/cursor":

			// extract the data
			id = values[0];
			group_id = values[1];

			x = values[2];
			y = values[3];
			z = values[4];

			x_world = values[5];
			y_world = values[6];
			z_world = values[7];

			// log the data
			log(
				  "CURSOR id: " + id + "\t\t\t\t"
				+ "GROUP: " +  group_id + "\n"
				+ "COORDS: (" + x + ", " + y + ", " + z + ")" + "\t"
				+ "WORLD: (" + x_world + ", " + y_world + ", " + z_world + ")"
			);

			// index of the cursor object in our list of unity world objects
			i = id - firstCursorID;

			// update coordinates if there is a game object corresponding to the index
			if(i >= 0 && i < cursorCoord.length) {
				cursorCoord[i] = new Vector3(x_world, y_world, z_world);
			}

			break;

		// FORMAT: /trigger id group_id x y z x_world y_world z_world
		case "/trigger":

			// extract the data
			id = values[0];
			group_id = values[1];

			x = values[2];
			y = values[3];
			z = values[4];

			x_world = values[5];
			y_world = values[6];
			z_world = values[7];

			// log the data
			log(
				  "CURSOR id: " + id + "\t\t\t\t"
				+ "GROUP: " +  group_id + "\n"
				+ "COORDS: (" + x + ", " + y + ", " + z + ")" + "\t"
				+ "WORLD: (" + x_world + ", " + y_world + ", " + z_world + ")"
			);

			// index of the trigger object in our list of unity world objects
			i = id - firstTriggerID;

			// update coordinates if there is a game object corresponding to the index
			if(i >= 0 && i < triggerCoord.length) {
				triggerCoord[i] = new Vector3(x_world, y_world, z_world);
				triggerValue[i] = 0.25;
			}

			break;


		case "/curve":
			break;

		case "/transport":
			break;

	}

}