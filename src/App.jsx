import React from "react"

class App extends React.Component{

    constructor(props) {
        super(props);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.create = this.create.bind(this);
        this.describe = this.describe.bind(this);
        this.authentificate = this.authentificate.bind(this);
        this.createStream = this.createStream.bind(this);
        this.stopStream = this.stopStream.bind(this);
        this.startStream = this.startStream.bind(this);
        this.removeStream = this.removeStream.bind(this);
        this.createPlayer = this.createPlayer.bind(this);
        this.removePlayer = this.removePlayer.bind(this);
        this.createRestream = this.createRestream.bind(this);
        this.removeRestream = this.removeRestream.bind(this);

        this.state = {
            instanceId : "create instance",
            instanceData: {
                Reservations: [{
                    Instances: [{
                        InstanceId: 'create a new instance',
                        ImageId: 'create a new instance',
                        State: {Name: 'create a new instance'},
                        PublicIpAddress: 'create a new instance'
                    }],
                }]},
            instanceIndex: 0,
            callabaToken: "",
            serverId: "no server id",
            serverState: "no server",
            playerId: "no player id",
            playerState: "no player",
            youtubeKey: "",
            restreamId: "no restream"
        };
    }
    //functions to communicate with express server
    start(){
        fetch("/start")
            .then(() => this.describe())
    }

    stop(){
        fetch("/stop")
            .then(() => this.describe())
    }

    create(){
        fetch("/create")
            .then(res => {return res.json()})
            .then((data) => {
                this.describe()
                this.setState({instanceId: data.instanceId});
                sessionStorage.setItem("instanceId", data.instanceId); // Saving the instance ID to a Session storage
            })
    }

    describe(){
        fetch("/describe")
            .then(res => {return res.json()})
            .then(data => data.Reservations.length? this.setState({instanceData: data}):0)
            .then(()=>{
                this.state.instanceData.Reservations.forEach((Reservation, index) => {
                    if(Reservation.Instances[0].InstanceId === this.state.instanceId)
                        this.setState({instanceIndex: index});
                })
            })
    }

    // Functions to communicate with Callaba API

    // Getting access token
    authentificate(){
        fetch('http://' + this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress + '/api/auth/login',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    {
                        email: "admin",
                        password: this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].InstanceId
                    })
            })
            .then(response => response.json())
            .then(data => {
                this.setState({callabaToken: data.token});
                console.log(data);
            })
    }

    // Creating a new SRT server
    createStream(){
        fetch('http://' + this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress + '/api/servers/create',
            {
                method: 'POST',
                headers: {
                    'x-access-token': this.state.callabaToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    {
                        server_name: "Test SRT server", // CHANGE WITH ANY SERVER NAME YOU WANT
                        server_type: "SERVER_TYPE_SRT",
                        server_port: 1935,
                        server_latency: 200,
                        server_maxbw: -1,
                        server_timeout: 60,
                        server_rcvbuf: 48234496,
                        server_active: true
                        })
            })
            .then(response => response.json())
            .then(data => {
                this.setState({serverId: data._id, serverState: "server running"});
            })
    }
    // Stopping an SRT server
    stopStream(){
        fetch('http://' + this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress + '/api/servers/stop',
            {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'x-access-token': this.state.callabaToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        id: this.state.serverId
                    })
            })
            .then(response => response.json())
            .then(data => {
                if(data.ok) this.setState({serverState: "server stopped"});
            })
    }
    // Starting a stopped SRT server
    startStream(){
        fetch('http://' + this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress + '/api/servers/start',
            {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'x-access-token': this.state.callabaToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        id: this.state.serverId
                    })
            })
            .then(response => response.json())
            .then(data => {
                if(data.ok) this.setState({serverState: "server running"});
            })
    }
    // Removing an SRT server
    removeStream(){
        fetch('http://' + this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress + '/api/servers/remove',
            {
                method: 'DELETE',
                headers: {
                    'accept': 'application/json',
                    'x-access-token': this.state.callabaToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        id: this.state.serverId
                    })
            })
            .then(response => response.json())
            .then(data => {
                if(data.ok) this.setState({serverState: "no server", serverId: "no server id"});
            })
    }
    // Creating a new Web Player of your SRT stream
    createPlayer(){
        fetch('http://' + this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress + '/api/vod/create',
            {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'x-access-token': this.state.callabaToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                    vod_name: "Test SRT player",
                    input: {
                        input_type: "INPUT_TYPE_SRT_SOFTWARE",
                        input_server_id: this.state.serverId,
                        input_stream_id: "publisher/test-srt-server/srt-stream-01"
                    },
                    vod_port: 10001,
                    initial_live_manifest_size: 4,
                    live_sync_duration_count: 4,
                    hls_fragment_size: 3,
                    hls_fragment_length: 60,
                    dash_fragment_size: 3,
                    dash_fragment_length: 60,
                    active: true
                })
            })
            .then(response => response.json())
            .then(data => this.setState({playerId: data._id, playerState: "running"}))
    }
    // Removing a Web player
    removePlayer(){
        fetch('http://' + this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress + '/api/vod/remove',
            {
                method: 'DELETE',
                headers: {
                    'accept': 'application/json',
                    'x-access-token': this.state.callabaToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({id: this.state.playerId})
            })
            .then(response => response.json())
            .then(() => this.setState({playerState: "no player"}))
    }
    // Creating a restream on YouTube
    createRestream(){
        fetch('http://'+ this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress +'/api/restream/create',
            {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'x-access-token': this.state.callabaToken,
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    restream_name: "Test restream",
                    restream_type: "RESTREAM_TYPE_SRT_TO_RTMP",
                    input: {
                        input_type: "INPUT_TYPE_SRT_SOFTWARE",
                        input_server_id: this.state.serverId,
                        input_stream_id: "publisher/test-srt-server/srt-stream-01",
                        module_name: "test youtube",
                        module_type: "MODULE_RESTREAM"
                    },
                    output: {
                        output_type: "OUTPUT_TYPE_OTHER_RTMP_URL",
                        output_stream_url : "rtmp://x.rtmp.youtube.com/live2" ,
                        output_stream_key: "f9da-dgj8-gq64-mjp2-7d0w"
                    },
                    active: true
                })
            })
            .then(response => response.json())
            .then(data => this.setState({restreamId: data._id}))
    }
    // Removing a restream on YouTube
    removeRestream(){
        fetch('http://'+ this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress +'/api/restream/remove',
            {
                method: 'DELETE',
                headers: {
                    'accept': 'application/json',
                    'x-access-token': this.state.callabaToken,
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                        id: this.state.restreamId
                    })
            })
            .then(response => response.json())
            .then(() => this.setState({restreamId: "no restream"}))
    }



    render(){
        return(
            <div className="App">
                <header className="App-header">
                    <div>
                        <h3>INSTANCE</h3>
                        <div className={'box'}>
                            <div className={'box-info'}>
                                <p className={'field'}>{
                                    this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].InstanceId}</p>
                                <p className={'field'}>{
                                    this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].ImageId}</p>
                                <p className={'field'}>{
                                    this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].State.Name}</p>

                            </div>
                            <div className={'box-manage'}>
                                <button className={'button'} onClick={this.start}>Start</button>
                                <button className={'button'} onClick={this.stop}>Stop</button>
                                <button className={'button'} onClick={this.create}>Create</button>
                            </div>
                        </div>
                        <h3>SRT SERVER</h3>
                        <div className={'box'}>
                            <div className={'box-info'}>
                                <p className={'field'}>{
                                    this.state.callabaToken !== "" ? "authorised" : "not authorised"
                                }</p>
                                <p className={'field'}>{
                                    this.state.serverId
                                }</p>
                                <p className={'field'}>{
                                    this.state.serverState
                                }</p>
                                <p className={'field'}
                                   style={{cursor: "pointer"}}
                                   onClick={() =>  navigator.clipboard.writeText("srt://" + this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress + ":1935?streamid=publisher/test-srt-server/srt-stream-01&latency=200000&maxbw=-1")}
                                >
                                    &#10063; copy OBS URL
                                </p>
                                <p className={'field'}
                                   style={{cursor: "pointer"}}
                                   onClick={() =>  navigator.clipboard.writeText("srt://" + this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress + ":1935?streamid=publisher/test-srt-server/srt-stream-01")}
                                >
                                    &#10063; copy ffmpeg URL
                                </p>
                            </div>
                            <div className={'box-manage'}>
                                <button className={'button'} onClick={this.authentificate}>Auth</button>
                                <button className={'button'} onClick={this.createStream}>Create</button>
                                <button className={'button'} onClick={this.stopStream}>Stop</button>
                                <button className={'button'} onClick={this.startStream}>Start</button>
                                <button className={'button'} onClick={this.removeStream}>Remove</button>
                            </div>
                        </div>
                        <h3>WEB PLAYER</h3>
                        <div className={'box'}>
                            <div className={'box-info'}>
                                <p className={'field'}>{this.state.playerState}</p>
                                <p className={'field'}>{this.state.playerState !== "running" ? "no web player": <a target="_blank" href={'http://' + this.state.instanceData.Reservations[this.state.instanceIndex].Instances[0].PublicIpAddress + "/vod-player/" + this.state.playerId}>Web player</a>}</p>
                            </div>
                            <div className={'box-manage'}>
                                <button className={'button'} onClick={this.createPlayer}>Create</button>
                                <button className={'button'} onClick={this.removePlayer}>Remove</button>
                            </div>
                        </div>
                        <h3>RESTREAM TO YOUTUBE</h3>
                        <div className={'box'}>
                            <div className={'box-info'}>
                                <p><input className={'input'} type="text" placeholder={'enter youtube stream key'} onClick={(event)=>{this.setState({youtubeKey: event.target.value})}}/></p>
                                <p className={'field'}>{this.state.restreamId}</p>
                            </div>
                            <div className={'box-manage'}>
                                <button className={'button'} onClick={this.createRestream}>Create</button>
                                <button className={'button'} onClick={this.removeRestream}>Remove</button>
                            </div>
                        </div>
                        <div className={'gap'}></div>
                    </div>
                </header>
            </div>
        );
    }

    componentDidMount(){
        this.describe();
        setInterval(this.describe, 10000); // Monitoring the instances of your account
        if(sessionStorage.getItem("instanceId")){ //Checking for the last created instance in this session
            this.setState({instanceId: sessionStorage.getItem("instanceId")})
        }
    }
}

export default App;