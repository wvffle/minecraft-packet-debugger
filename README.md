# minecraft-packet-debugger
![screenshot](https://i.imgur.com/wFDjg2Q.png)

## Installaion
### Installation with yarn
```sh
yarn global add mcpd
```

### Installation with npm
```sh
npm install -g mcpd
```

## Usage
Simply run `mcpd` command after installation and navigate to http://localhost:3000/
```shell script
$ mcpd -h
Usage: mcpd [options]

Options:
  -V, --version        output the version number
  -p, --port <number>  Port to run on. Default: 3000
  -h, --help           output usage information
```


## Packet monitoring
To start monitoring packets click on the 'Record' button.
![record button](https://i.imgur.com/7mQplLu.png)

### Buffer
The buffer size for the application is 2048 packets. Too many packets may be slowing down performance. To change the buffer size use `--buffer`. (**Not implemented yet.**)

### Filtering packets
#### Client side
You can use the filter button on a packet.

#### Server side
See [Ignoring packets](#Ignoring-packets)


## Configuration
All Settings are stored in `$HOME/.config/mcpd/config.json`

### Custom target server
You can change that in settings

### Proxy port
You can change that in settings

### Ignoring packets
You have to go to the settings and in there, you can choose which packets should be ignored by the server.
![ignore settings](https://i.imgur.com/YHInhe5.png)
