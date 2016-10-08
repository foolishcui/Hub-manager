/**
 * Created by foolishcui on 2016/8/10.
 */
var message;
var isconnected = false;
var wsock;
var curr_msg;
$(function() {
    //mywebsockinit();
    var graph = new Q.Graph("canvas");

    //写死的拓扑图生成策略
    var json = JSON.parse('{"nodes":[{"name": "cell_cube", "id": 1, "x": 200, "y": 0, "object": "entity","type": "endpoint","plantform": "phone","owner": "zhao"}, {"name": "MsgHub", "id": 2, "x": 200, "y": -150, "object": "entity","type": "hub","owner": "zhao"},{"name": "MsgServer","id": 3,"x": -300,"y": -160,"object": "entity","type": "server"},{"name": "TrustHub","id": 4,"x": 200,"y": -300,"object": "entity","type": "sechub","owner": "zhao","plugin": ["crypto","signer","blackfilter","whitefilter"]}, {"name": "crypto","id": 5,"x": -270,"y": 220,"object": "entity","type": "secplugin","owner": "zhao","desc": "一个基于可信根实现密钥交换的对称钥加密模块"}, {"name": "signer","id": 6,"x": -110,"y": 220,"object": "entity","type": "secplugin","owner": "zhao","desc": "一个基于可信根实现可信签名的签名模块"}, {"name": "blackfilter","id": 7,"x": 50,"y": 220,"object": "entity","type": "secplugin","owner": "zhao","desc": "一个黑名单过滤策略模块","policy":[]}, {"name": "whitefilter","id": 8,"x": 210,"y": 220,"object": "entity","type": "secplugin","owner": "zhao","desc": "一个白名单过滤策略模块","policy": ["zhao"]}], "edges": [{"name": "GENERAL","from":1,"to":2,"object": "connector","route": ["cell_cube", "MsgHub", "MsgServer"]},{"name": "GENERAL", "from":2, "to":3, "object": "connector", "route": ["cell_cube", "MsgHub", "MsgServer"]},{"name": "PRIVATE", "from":1, "to":2, "object": "connector", "route": ["cell_cube", "MsgHub", "MsgServer"]},{"name": "PRIVATE", "from":2, "to":3, "object": "connector", "route": ["cell_cube", "MsgHub", "MsgServer"]},{"name": "ANNOUNCED", "from":1, "to":2, "object": "connector", "route": ["cell_cube", "MsgHub", "MsgServer"]},{"name": "ANNOUNCED", "from":2, "to":3, "object": "connector","route": ["cell_cube", "MsgHub", "MsgServer"]}]}');
    console.log(json);

    //jQuery使用ajax获取远程json文件生成拓扑图
    // var json;
    // $.getJSON("data-server.json", function(data){
    //     json = JSON.parse(data);
    // });
    // console.log(json);

    //生成节点，包括终端、hub与安全插件
    var map = {};
    if(json.nodes){
        Q.forEach(json.nodes, function(data){
            if(data.name == 'MsgServer') {
                var node = graph.createNode(data.name, data.x || 0, data.y || 50);
                node.image = "./img/server.png";
                node.set("data", data);
                map[data.id] = node;
            }else if(data.name == 'cell_cube'){
                var node = graph.createNode(data.name, data.x || 0, data.y || 0);
                node.image = "./img/cell_cube.png";
                node.set("data", data);
                map[data.id] = node;
            }else if(data.name == 'MsgHub'){
                var nodePlugin = graph.createNode(data.name, data.x || 0, data.y || 0);
                nodePlugin.image = "./img/MsgHub.png";
                nodePlugin.set("data", data);
                map[data.id] = nodePlugin;
            }else if(data.name == 'TrustHub'){
                var nodePlugin = graph.createNode(data.name, data.x || 0, data.y || 0);
                nodePlugin.image = "./img/TrustHub.png";
                nodePlugin.set("data", data);
                map[data.id] = nodePlugin;
            }else if(data.name == 'whitefilter'){
                var nodePlugin = graph.createNode(data.name, data.x || 0, data.y || 0);
                nodePlugin.image = "./img/whitefilter.png";
                nodePlugin.set("data", data);
                map[data.id] = nodePlugin;
            }else if(data.name == 'blackfilter'){
                var nodePlugin = graph.createNode(data.name, data.x || 0, data.y || 0);
                nodePlugin.image = "./img/blackfilter.png";
                nodePlugin.set("data", data);
                map[data.id] = nodePlugin;
            }else if(data.name == 'signer'){
                var nodePlugin = graph.createNode(data.name, data.x || 0, data.y || 0);
                nodePlugin.image = "./img/signer.png";
                nodePlugin.set("data", data);
                map[data.id] = nodePlugin;
            }else if(data.name == 'crypto'){
                var nodePlugin = graph.createNode(data.name, data.x || 0, data.y || 0);
                nodePlugin.image = "./img/crypto.png";
                nodePlugin.set("data", data);
                map[data.id] = nodePlugin;
            }
        });
    }
    //生成信道
    if(json.edges){
        var i=0;
        Q.forEach(json.edges, function(data){
            var from = map[data.from];
            var to = map[data.to];
            i++;
            if(!from || !to){
                return;
            }
            var edge = graph.createEdge(data.name, from, to);
            edge.set("data", data);
            if(i<3) {
                edge.setStyle(Q.Styles.EDGE_COLOR, '#0272BD');
            }else if(i<5) {
                edge.setStyle(Q.Styles.EDGE_COLOR, '#06AE55');
            }else {
                edge.setStyle(Q.Styles.EDGE_COLOR, '#FF0F1C');
            }
        }, graph);
    }

    //根据界面的操作生成json数据
    function generateJsonToSend(selectedConnectorName, selectedPluginName) {
        //生成json数据
       // var datas =[];
        var data = {};

        data["MATCH_POLICY"] = ({"sender": "message_expand", "rules": [{"op":"AND","area":"HEAD","seg":"record_type","value":"MSGD"},
            {"op":"AND","area":"RECORD","seg":"flag","value":selectedConnectorName}]});
        data["ROUTER_POLICY"] = ({"main_policy": {"type": "ASPECT","state": "ASPECT","target_type": "NAME","target_name":"TrustHub"}});
        var jsonString = JSON.stringify(data);
        console.log(jsonString);

        //对jsonString进行base64编码
        //本地安装node.js, 使用npm包管理器 npm install base64-js
        //https://github.com/beatgammit/base64-js
        //UTF-16 => UTF- convertion
        utf8 = utf16to8(jsonString);
        console.log(utf8);
        //base64encode,b64是经过base64编码的字符串
        b64 = base64encode(utf8);

        //定义新的json策略并发送
        var output = {};
        var policy_size = utf8.length;
        console.log(policy_size);
        output = {"proc_name": "MsgHub", "policy_size": policy_size, "policy_data": b64};
        var msg = new Cube_msg("POLI");
        msg.addrecord(output);
        var data1= {};

        data1["MATCH_POLICY"] = ({"sender": "connector_proc", "rules": [{"op":"AND","area":"HEAD","seg":"record_type","value":"MSGD"},
                    {"op":"AND","area":"RECORD","seg":"flag","value":selectedConnectorName}]});
        data1["ROUTER_POLICY"] = ({"main_policy": {"type": "ASPECT_LOCAL","state": "ASPECT_LOCAL","target_type": "NAME","target_name":selectedPluginName}});
        var jsonString1 = JSON.stringify(data1);
        utf81 = utf16to8(jsonString1);
        console.log(utf81);
        //base64encode,b64是经过base64编码的字符串
        b641 = base64encode(utf81);

        //定义新的json策略并发送
        output1 = {};
        policy_size1 = utf81.length;
        console.log(policy_size1);
        output1 = {"proc_name": "TrustHub", "policy_size": policy_size1, "policy_data": b641};
        msg.addrecord(output1);

        //alert(msg.output());
        wsock.send(msg.output());

        //outputs.push(output);
        //var jsonOutputs = JSON.stringify(outputs);
        //console.log(jsonOutputs);

        //jQuery ajax发送json数据,这里的 cube-server为发送的url
        //$.post("cube-server.asp", jsonOutputs, function(data,status){
        //    consoloe.log("数据：" + data + "\n状态：" + status);
  //      });
        //这里从服务器获取的数据为策略的确认信息
    }

    //选择安全插件产生安全策略,确定选择的信道与安全插件，单击确定信道，单击确定插件
    var selectedConnector;
    var selectedConnectorName;
    var selectedPlugin;
    var selectedPluginName;
    function selectTarget() {
        graph.addCustomInteraction({
            onclick: function(evt, graph) {
                Q.log("click");
                selectedConnector = evt.getData();
                selectedPlugin = evt.getData();
                if(selectedConnector instanceof Q.Edge) {
                    console.log("is edge");
                    selectedConnectorName = selectedConnector.name;
                    console.log(selectedConnectorName);
                }else if(selectedPlugin instanceof Q.Node){
                    console.log("is plugin");
                    selectedPluginName = selectedPlugin.name;
                    console.log(selectedPluginName);
                    var r = confirm("您选择了" + selectedConnectorName + "信道与" + selectedPluginName + "插件");
                    if(r=true) {
                        generateJsonToSend(selectedConnectorName, selectedPluginName);
                    }else {
                        return;
                    }
                }
            },
            // ondblclick: function(evt, graph) {
            //     Q.log("dblclick");

            //     if(!(selectedPlugin instanceof Q.Node)) {
            //         return;
            //     }
            //     console.log("is plugin");
            //     selectedPluginName = selectedPlugin.name;
            //     console.log(selectedPluginName);
            //     generateJsonToSend(selectedConnectorName, selectedPluginName);
            // }
        });
    }
    //调用函数selectTarget()
    selectTarget();
});
function mywebsockinit() {
    if (isconnected) {
        alert("已连接服务器！")
        return;
    }
//    var netaddr=document.getElementById("addr");
//    var netport=document.getElementById("port");

    wsock = new WebSocket('ws://192.168.159.135:15888', 'cube-wsport');
//    wsock = new WebSocket('ws://'+netaddr.value+':'+netport.value, 'cube-wsport');
    //alert(netaddr.value+":"+netport.value);
    wsock.onopen = function (e) {
        if (!isconnected) {
            isconnected = true;
            alert("连接成功！");
            /*aftAniSuccess();*/
        }
        return;
    };
    wsock.onclose = function (e) {
        //alert("1111111111");
    };
    wsock.onerror = function (e) {
        //console.log("2222222222");
        alert("连接失败！");
        /*myFunction();*/
    };
    wsock.onmessage = function (e) {
        var msg;
        msg = e.data;
        if (msg.replace(/(^s*)|(s*$)/g, "").length != 0) {
            msg=JSON.parse(msg);
            console.log(msg);
            console.log(msg.HEAD.record_type);
            if(msg.HEAD.record_type=="SYNI"){
                ;
            }
            else if(msg.HEAD.record_type=='MSGD'){
                if(msg.RECORD.BIN_FORMAT)
                    insertcrypto(msg.RECORD.BIN_FORMAT);
                else
                {
                    curr_msg=msg.RECORD[0];
                    if(curr_msg.flag=="GENERAL")
                        insert(curr_msg);
                    else if(curr_msg.flag=="PRIVATE")
                        insert(curr_msg);
                }
            }

        }
        //console.log(msg.HEAD);
    }

}
    // graph.addCustomInteraction({
    //     startdrag: function(evt, graph) {
    //         Q.log("start");
    //         selectedPlugin = evt.getData();
    //         console.log(selectedPlugin);
    //         evt.responded = true;
    //         this.selectedPlugin = selectedPlugin;
    //     },
    //     ondrag: function(evt, graph) {
    //         Q.log("ondrag");
    //         graph.cursor = "pointer";
    //     },
    //     enddrag: function(evt, graph) {
    //         Q.log("enddrag");
    //         console.log("asd");
    //         var selectedPluginName = selectedPlugin.name;
    //         console.log(selectedPluginName);
    //         var x = selectedPlugin.x;
    //         var y = selectedPlugin.y;
    //         console.log(x,y);
    //         var TrustHub = graph.getElementByName('TrustHub');
    //         var targetX = TrustHub.x;
    //         var targetY = TrustHub.y;
    //         if((x-targetX)*(x-targetX)+(y-targetY)*((y-targetY))<400) {
    //             console.log("ok");
    //             generateJson(selectedPluginName);
    //         }
    //     }
    // });
