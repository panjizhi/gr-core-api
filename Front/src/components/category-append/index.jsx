import React from 'react';
import { Divider, Icon, Input, Popconfirm } from 'antd';
import './index.css';

export default class CategoryAppend extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            value: props.value,
            remove: props.remove,
            append: props.append,
            placeholder: props.placeholder
        };
    }

    componentWillReceiveProps(nextProps)
    {
        if (nextProps.value !== this.state.value)
        {
            this.setState({
                value: nextProps.value,
                remove: nextProps.remove,
                append: nextProps.append,
                placeholder: nextProps.placeholder
            });
        }
    }

    onConfirm()
    {
        const onRemove = this.props.onRemove;
        onRemove(this.state.value);
    }

    onSearch(value)
    {
        const onAppend = this.props.onAppend;
        onAppend(this.state.value, value);
    }

    render()
    {
        const { value: { name }, remove, append, placeholder } = this.state;

        return (
            <div className="cat-append">
                <Divider style={ {
                    margin: '8px 0'
                } } />
                <div className="cat-append-item">
                    您选择了{ name }
                    {
                        remove ? (
                            <Popconfirm placement="top" title={ '是否移除\'' + name + '\'？' } onConfirm={ this.onConfirm.bind(this) } okText="移除" cancelText="取消">
                                <Icon type="delete" size="small" style={ { marginLeft: '20px' } } />
                            </Popconfirm>
                        ) : null
                    }
                </div>
                {
                    append ? (
                        <div className="cat-append-item">
                            <Input.Search
                                className="cat-append-input"
                                placeholder={ placeholder }
                                size="small"
                                enterButton={ <Icon type="save" /> }
                                onSearch={ this.onSearch.bind(this) }
                            />
                        </div>
                    ) : null
                }
            </div>
        )
    }
}
