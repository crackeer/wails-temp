import { useState, useEffect } from "react";
import "./App.css";
import { AddServer, GetServers, RemoveServer, AddCommand, GetCommands, RemoveCommand, ExecCommand } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime/runtime";

import { Button, Card, Row, Col, Modal, Form, Input, Radio, Flex, Table, Space, message, Divider, List, Splitter } from "antd";
import { UnorderedListOutlined, PlusOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from '@xterm/addon-fit';

function App() {
    const [showAddServer, setShowAddServer] = useState(false);
    const [showServerList, setShowServerList] = useState(false);
    const [currentServer, setCurrentServer] = useState({});
    const [showAddCommand, setShowAddCommand] = useState(false);

    const [servers, setServers] = useState([]);
    const [commands, setCommands] = useState([]);
    const [form] = Form.useForm();
    const [form1] = Form.useForm();
    const fitAddon = new FitAddon();
    const columns = [
        {
            title: '名字',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'ServerIP',
            dataIndex: 'name',
            key: 'name',
            render: (_, item) => `${item.ip}:${item.port}`,
        },
        {
            title: '用户',
            dataIndex: 'user',
            key: 'user',
        },
        {
            title: '密码',
            dataIndex: 'password',
            key: 'password',
        },
        {
            title: '操作',
            dataIndex: 'address',
            key: 'address',
            render: (_, record) => (
                <Space size="middle">
                    <a>复制</a>
                    <a onClick={deleteServer.bind(this, record)}>删除</a>
                </Space>
            ),
        },

    ];
    var term = null;
    useEffect(() => {
        getServers();
        getCommands();
        console.log("useEffect")
        term = new Terminal({
            rendererType: "canvas", //渲染类型
            rows: 20, //行数
            convertEol: true, //启用时，光标将设置为下一行的开头
            // scrollback: 50, //终端中的回滚量
            disableStdin: false, //是否应禁用输入
            // cursorStyle: "underline", //光标样式
            cursorBlink: true, //光标闪烁
            theme: {
                foreground: "#ECECEC", //字体
                background: "#000000", //背景色
                cursor: "help", //设置光标
                lineHeight: 20
            }
        })
        term.loadAddon(fitAddon);
        term.open(document.getElementById('terminal'));
        //term.writeln("hello")
        console.log(term)
        EventsOn('command-exec-output', termWrite)

    }, []);

    function termWrite(data) {
        let parts = data.split('\n')
        for (var i in parts) {
            term.writeln(parts[i])
        }
    }

    async function getCommands() {
        let result = await GetCommands();
        console.log(result)
        setCommands(result)
    }
    async function getServers() {
        let result = await GetServers();
        setServers(result)
        if (result.length > 0 && currentServer.length < 1) {
            setCurrentServer(result[0].id)
        }
        console.log(result)
    }


    async function showServerListModal() {
        await getServers()
        setShowServerList(true);
    }

    async function deleteServer(record) {
        Modal.confirm({
            title: '删除确认',
            content: '确定删除' + record.name + '吗？',
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                RemoveServer(record.id).then(() => {
                    message.info("删除成功")
                    getServers()
                })
            },
            onCancel() {
                console.log('Cancel');
            },
        });
    }


    function showAddServerModal() {
        setShowAddServer(true);
    }

    async function doAddServer() {
        form.validateFields().then((values) => {
            let data = form.getFieldsValue(true)
            console.log(data)
            AddServer(data).then(() => {
                getServers().then(() => {
                    message.info("添加成功")
                    setShowAddServer(false)
                })
            })
        }, (errorInfo) => {
            console.log("Failed:", errorInfo);
        });
    }

    async function doAddCommand() {
        form1.validateFields().then((values) => {
            let data = form1.getFieldsValue(true)
            console.log(data)
            AddCommand(data).then(() => {
                getCommands().then(() => {
                    message.info("添加成功")
                    setShowAddCommand(false)
                })
            })
        }, (errorInfo) => {
            console.log("Failed:", errorInfo);
        }
        );
    }

    function execCommand(record) {
        Modal.confirm({
            title: '确认',
            content: '确认执行该command吗？',
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                ExecCommand(currentServer, record.id).then((result) => {
                    console.log("exec finished")
                }).catch(e => {
                    console.log(e)
                })
            },
            onCancel() {
                console.log('Cancel');
            },
        });
    }

    function deleteCommand(record) {
        Modal.confirm({
            title: '删除确认',
            content: '确定删除command：' + record.name + '吗？',
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                RemoveCommand(record.id).then(() => {
                    message.info("删除成功")
                    getCommands()
                })
            },
            onCancel() {
                console.log('Cancel');
            },
        });
    }



    return (
        <div id="App">
            <div id="terminal"></div>
            <div className="setting">
                <Button
                    icon={<UnorderedListOutlined />}
                    color="default"
                    variant="text"
                    onClick={showServerListModal}
                ></Button>
                <div>
                    <Button
                        icon={<PlusOutlined />}
                        color="default"
                        variant="text"
                        onClick={showAddServerModal}
                    ></Button>
                </div>
            </div>

            <Row style={{ paddingTop: "10px" }}>
                <Col span={22} offset={1}>
                    <Card>
                        <Flex vertical gap="middle">
                            <Radio.Group
                                block
                                optionType="button"
                                buttonStyle="solid"
                                value={currentServer}
                                onChange={(e) => setCurrentServer(e.target.value)}
                            >
                                {servers.map((option) => { return <Radio.Button key={option.id} value={option.id}>{option.name + '-' + option.ip}</Radio.Button> })}
                            </Radio.Group>
                        </Flex>
                        <h2>命令列表 <Button type="primary" size="small" shape="circle" icon={<PlusOutlined />} onClick={() => setShowAddCommand(true)}></Button></h2>
                        <Row gutter={10}>
                            {
                                commands.map((option) => {
                                    return <Col span={12}>
                                        <Card type="inner" size="small" title={option.name}>
                                            <List
                                                dataSource={option.data.split('\n')}
                                                size="small"
                                                renderItem={(item) => (
                                                    <List.Item>
                                                        {item}
                                                    </List.Item>
                                                )}
                                            />
                                            <Space style={{ marginTop: '15px' }} split={<Divider type="vertical" />} size={"small"}>
                                                <Button type="link" onClick={deleteCommand.bind(this, option)} size="small">删除</Button>
                                                <Button type="link" onClick={execCommand.bind(this, option)} size="small">执行</Button>
                                            </Space>
                                        </Card>
                                    </Col>
                                })
                            }
                        </Row>

                    </Card>
                </Col>
            </Row>
            <Modal title="服务器列表" open={showServerList} onCancel={() => setShowServerList(false)} width={'70%'}>
                <Table
                    columns={columns}
                    rowKey={(record) => record.ip}
                    dataSource={servers}
                    pagination={false}
                    size="small"
                />
            </Modal>
            <Modal
                title="添加服务器"
                open={showAddServer}
                onCancel={() => setShowAddServer(false)}
                onOk={doAddServer}
            >
                <Form
                    name="basic"
                    form={form}
                    labelCol={{ span: 5 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{ name: '', port: '22', user: 'root', password: '1234567', ip: '' }}
                    style={{ marginTop: '30px' }}
                    autoComplete="off"
                >
                    <Form.Item label="名字" name="name" rules={[{ required: true, message: "Please input your name!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="ServerIP" name="ip" rules={[{ required: true, message: "Please input your server_ip!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Port" name="port" rules={[{ required: true, message: "Please input your port!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="User" name="user" rules={[{ required: true, message: "Please input your username!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Password" name="password" rules={[{ required: true, message: "Please input your password!" }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="添加Command"
                open={showAddCommand}
                onCancel={() => setShowAddCommand(false)}
                onOk={doAddCommand}
                width={'60%'}
            >
                <Form
                    name="basic1"
                    form={form1}
                    labelCol={{ span: 5 }}
                    wrapperCol={{ span: 19 }}
                    initialValues={{ name: '名字1', data: '' }}
                    style={{ marginTop: '30px' }}
                    autoComplete="off"

                >
                    <Form.Item label="名字" name="name" rules={[{ required: true, message: "Please input name!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="命令行" name="data" rules={[{ required: true, message: "Please input your port!" }]}>
                        <Input.TextArea rows={10} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default App;
