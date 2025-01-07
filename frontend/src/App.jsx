import { useState, useEffect } from "react";
import "./App.css";
import { AddServer, GetServers, RemoveServer, AddCommand, GetCommands, RemoveCommand, SimpleExecCommand } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime/runtime";

import { Button, Card, Row, Col, Modal, Form, Input, Radio, Flex, Table, Space, message, List, Splitter, Divider, Checkbox } from "antd";
import { UnorderedListOutlined, PlusOutlined, ArrowUpOutlined, LoadingOutlined } from "@ant-design/icons";

var term = null;

function App() {
    const [showAddServer, setShowAddServer] = useState(false);
    const [editFlag, setEditFlag] = useState(false);
    const [showServerList, setShowServerList] = useState(false);
    const [checkedServers, setCheckedServers] = useState([])
    const [showCommandList, setShowCommandList] = useState(false);
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
                    <a onClick={toCopyServer.bind(this, record)}>复制</a>
                    <a onClick={deleteServer.bind(this, record)}>删除</a>
                    <a onClick={toEditServer.bind(this, record)}>edit</a>
                </Space>
            ),
        },
    ];
    const columns1 = [
        {
            title: '名字',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            render: (_, record) => (
                <Space size="middle">
                    <a onClick={toCopyCommand.bind(this, record)}>复制</a>
                    <a onClick={deleteCommand.bind(this, record)}>删除</a>
                    <a onClick={toEditCommand.bind(this, record)}>edit</a>
                </Space>
            ),
        },

    ]


    useEffect(() => {
        getServers();
        getCommands();
    }, []);

    async function getCommands() {
        let result = await GetCommands();
        result.sort((a, b) => b.id - a.id)
        setCommands([...result])
    }
    async function getServers() {
        let result = await GetServers();
        result.sort((a, b) => b.id - a.id)
        setServers([...result])
    }

    async function showServerListModal() {
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

    async function toEditServer(record) {
        form.setFieldsValue(record)
        setEditFlag(true)
        setShowAddServer(true)
    }
    async function toCopyServer(record) {
        let copyData = lodash.cloneDeep(record)
        copyData.id = ''
        form.setFieldsValue(copyData)
        setEditFlag(false)
        setShowAddServer(true)
    }

    async function toEditCommand(params) {
        form1.setFieldsValue(params)
        setEditFlag(true)
        setShowAddCommand(true)
    }

    async function toCopyCommand(params) {
        let copyData = lodash.cloneDeep(params)
        copyData.id = ''
        form1.setFieldsValue(copyData)
        setEditFlag(true)
        setShowAddCommand(true)
    }

    function showAddServerModal() {
        form.setFieldsValue({
            id : '',
            name: '',
            port : '22',
            user: 'root',
            password: '1234567',
        })
        setEditFlag(false)
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
            content: <Input.TextArea value={record.data} rows={5} readOnly={true} style={{ width: '100%' }} />,
            width: '50%',
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

    async function selectServer(params) {
        setCheckedServers(params)
    }

    async function ExecCommand(record) {
        let list = []
        let readyCommand = record.data.split('\n')
        setCommandExec(list)
        let serversMapping = {}
        for (var i in servers) {
            serversMapping[servers[i].id] = servers[i]
        }
        for (var j in checkedServers) {
            let currentServer = serversMapping[checkedServers[j]]
            for (var i in readyCommand) {
                setRunningCommand('[' + currentServer.ip + ']' + readyCommand[i].trim())
                let result = await SimpleExecCommand(currentServer.id, readyCommand[i].trim())
                setRunningCommand('')
                list.unshift({
                    server : currentServer.name + '-' + currentServer.ip,
                    index: parseInt(i) + 1,
                    command: readyCommand[i].trim(),
                    output: result.output,
                    status: result.code == 0 ? 'success' : 'error'
                })
                setCommandExec(list)
                if (result.code != 0) {
                    return
                }
            }
        }
    }

    return (
        <div id="App">
            <Card size="small" title={<Space>
                服务器列表
                <Button color="default" type="link" size="small" onClick={showAddServerModal}>添加</Button>
                <Button
                        color="default"
                        type="link"
                        size="small"
                        onClick={showServerListModal}
                    >管理</Button>
                </Space>} style={{marginBottom: '10px'}}>
                <Checkbox.Group defaultValue={[]} value={checkedServers} onChange={selectServer}>
                    {
                        servers.map(item => {
                            return <Checkbox value={item.id} key={item.id}>{item.name}({item.ip})</Checkbox>
                        })}
                </Checkbox.Group>
            </Card>
            <Splitter style={{ height: '100%' }}>
                <Splitter.Panel defaultSize="30%" min="30%" max="50%" style={{ padding: '5px' }}>
                    <Card size="small" title={<Space>
                        <span>命令列表</span>
                        <Button type="link" size="small" onClick={() => setShowAddCommand(true)}>添加</Button>
                        <Button type="link" size="small" onClick={() => setShowCommandLst(true)}>管理</Button>
                    </Space>}>
                        <List
                            itemLayout="horizontal"
                            dataSource={commands}
                            bordered={true}
                            size="small"
                            renderItem={(item) => (
                                <List.Item
                                    actions={[<a key="list-loadmore-more" onClick={readyExecCommand.bind(this, item)}>执行</a>]}
                                    title={item.name}
                                >
                                    {item.name}
                                </List.Item>
                            )}
                        />
                    </Card>
                </Splitter.Panel>
                <Splitter.Panel style={{ padding: '10px' }}>
                    {runningCommand.length > 0 ? <Card size="small" title={'正在执行：' + runningCommand} style={{ marginBottom: '10px' }}>
                        <LoadingOutlined />
                    </Card> : null}
                    {
                        commandExec.map(item => {
                            return <Card size="small" title={'[' + item.server + '] ' + item.index + '. ' + item.command}>
                                <Input.TextArea value={item.output} rows={4}></Input.TextArea>
                            </Card>
                        })
                    }
                </Splitter.Panel>
            </Splitter>

            <Modal title="服务器列表" open={showServerList} onCancel={() => setShowServerList(false)} width={'70%'}>
                <Table
                    columns={columns}
                    rowKey={(record) => record.id}
                    dataSource={servers}
                    pagination={false}
                    size="small"
                />
            </Modal>
            <Modal
                title={editFlag ? 'Edit server' : 'Add server'}
                open={showAddServer}
                onCancel={() => setShowAddServer(false)}
                onOk={doAddServer}
                zIndex={9999}
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

            <Modal title="CommandList" open={showCommandList} onCancel={() => setShowCommandLst(false)} width={'70%'}>
                <Table
                    columns={columns}
                    rowKey={(record) => record.id}
                    dataSource={commands}
                    pagination={false}
                    size="small"
                />
            </Modal>


            <Modal
                title={editFlag ? '编辑Command' : '添加Command'}
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
