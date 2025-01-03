import { useState, useEffect } from "react";
import "./App.css";
import { AddServer, GetServers, RemoveServer, AddCommand, GetCommands, RemoveCommand, SimpleExecCommand } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime/runtime";

import { Button, Card, Row, Col, Modal, Form, Input, Radio, Flex, Table, Space, message, List, Splitter, Divider } from "antd";
import { UnorderedListOutlined, PlusOutlined, ArrowUpOutlined, LoadingOutlined } from "@ant-design/icons";

var term = null;

function App() {
    const [showAddServer, setShowAddServer] = useState(false);
    const [showServerList, setShowServerList] = useState(false);
    const [currentServer, setCurrentServer] = useState({});
    const [showAddCommand, setShowAddCommand] = useState(false);
    const [commandExec, setCommandExec] = useState([]);
    const [runningCommand, setRunningCommand] = useState('');
    const [servers, setServers] = useState([]);
    const [commands, setCommands] = useState([]);
    const [form] = Form.useForm();
    const [form1] = Form.useForm();
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
                    <a onClick={selectServer.bind(this, record)}>选择</a>
                </Space>
            ),
        },

    ];

    useEffect(() => {
        getServers();
        getCommands();
    }, []);

    async function getCommands() {
        let result = await GetCommands();
        result.sort((a, b) => b.id - a.id)
        setCommands(result)
    }
    async function getServers() {
        let result = await GetServers();
        setServers(result)
        if (result.length > 0 && currentServer.length < 1) {
            setCurrentServer(result[0].id)
        }
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

    async function selectServer(record) {
        setCurrentServer(record)
        setShowServerList(false)
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

    async function readyExecCommand(record) {
        Modal.confirm({
            title: '确定执行command：' + record.name + '吗？',
            content: <>
                {record.data.split('\n').map((item, index) => {
                    return <div key={index}>{item}</div>
                })}
            </>,
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                ExecCommand(record)
            },
            onCancel() {
                console.log('Cancel');
            },
        })
    }

    async function ExecCommand(record) {
        let list = []
        let readyCommand = record.data.split('\n')
        setCommandExec(list)
        for (var i in readyCommand) {
            setRunningCommand(readyCommand[i].trim())
            let result = await SimpleExecCommand(currentServer.id, readyCommand[i].trim())
            list.unshift({
                index: parseInt(i) + 1,
                command: readyCommand[i].trim(),
                output: result.output,
                status: result.code == 0 ? 'success' : 'error'
            })
            setCommandExec(list)
            setRunningCommand('')
            if (result.code != 0) {
                return
            }
        }
    }

    return (
        <div id="App">
            <Divider>
                <Space>
                    <span>
                        服务器：{currentServer.id == "" ? "未选择" : currentServer.name}
                    </span>
                    <Button color="default" type="link" size="small" onClick={showAddServerModal}>添加</Button>
                    <Button
                        color="default"
                        type="link"
                        size="small"
                        onClick={showServerListModal}
                    >列表</Button>
                </Space>
            </Divider>
            <Splitter style={{ height: '100%' }}>
                <Splitter.Panel defaultSize="30%" min="30%" max="50%" style={{ padding: '10px' }}>
                    <p style={{ margin: '10px' }}>
                        <span>命令列表</span> <Button type="link" size="small" onClick={() => setShowAddCommand(true)}>添加</Button>
                    </p>
                    <List
                        itemLayout="horizontal"
                        dataSource={commands}
                        bordered={true}
                        size="small"
                        renderItem={(item) => (
                            <List.Item
                                actions={[<a key="list-loadmore-edit" onClick={deleteCommand.bind(this, item)}>删除</a>, <a key="list-loadmore-more" onClick={readyExecCommand.bind(this, item)}>执行</a>]}
                                title={item.name}
                            >
                                {item.name}
                            </List.Item>
                        )}
                    />
                </Splitter.Panel>
                <Splitter.Panel style={{ padding: '10px' }}>
                    {runningCommand.length > 0 ? <Card size="small" title={'正在执行：' + runningCommand} style={{ marginBottom: '10px' }}>
                        <LoadingOutlined />
                    </Card> : null}
                    {
                        commandExec.map(item => {
                            return <Card size="small" title={item.index + '. ' + item.command}>
                                <Input.TextArea value={item.output} rows={4}></Input.TextArea>
                            </Card>
                        })
                    }
                </Splitter.Panel>
            </Splitter>

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
