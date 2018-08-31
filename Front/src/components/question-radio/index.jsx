import React from 'react';
import { Button, Icon, Input, message, Switch } from 'antd';
import PictureUpload from '../picture-upload';
import { IsUndefined } from "../../public/index";

import './index.css';

export default class QuestionRadio extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = QuestionRadio.InitializeValue(props.value);
    }

    componentWillReceiveProps(next)
    {
        this.setState(QuestionRadio.InitializeValue(next.value));
    }

    static InitializeValue(value)
    {
        let disorder = false;
        let options = [];
        if (value)
        {
            disorder = !!value.disorder;
            options = value.options;
        }

        return {
            disorder,
            options,
            selected_index: undefined,
            title: undefined,
            image: undefined
        };
    }

    onUploadCompleted(err, dat)
    {
        if (err)
        {
            return message.error(err);
        }

        this.setState({
            image: dat
        });
    }

    onOptionTitleChanged(e)
    {
        this.setState({
            title: e.target.value
        });
    }

    onAddOption()
    {
        const { options, selected_index, title, image } = this.state;
        if (!title)
        {
            return message.info('请输入选项文字');
        }

        if (!IsUndefined(selected_index))
        {
            const opt = options[selected_index];
            opt.title = title;
            opt.image = image;
        }
        else
        {
            options.push({
                title: title,
                image: image,
                right: 0
            });
        }

        this.onValueChanged();

        this.setState({
            options: options,
            selected_index: undefined,
            title: undefined,
            image: undefined
        });
    }

    onRightSelected(index, e)
    {
        e.stopPropagation();

        const { options } = this.state;
        const option = options[index];
        if (option.right)
        {
            return;
        }

        options.forEach(ins => ins.right = 0);
        option.right = 1;

        this.onValueChanged();

        this.setState({
            options: options
        });
    }

    onOptionRemoved(index, e)
    {
        e.stopPropagation();

        const { options, selected_index, title, image } = this.state;
        options.splice(index, 1);

        this.onValueChanged();

        const isSelected = this.state.selected_index === index;
        this.setState({
            options: options,
            selected_index: isSelected ? undefined : selected_index,
            title: isSelected ? undefined : title,
            image: isSelected ? undefined : image
        });
    }

    onValueChanged()
    {
        const { onValueChanged } = this.props;
        const { disorder, options } = this.state;
        onValueChanged && onValueChanged({
            disorder: disorder ? 1 : 0,
            options,
            right: options.findIndex(ins => !!ins.right)
        });
    }

    onOptionSelected(index)
    {
        const { options, selected_index, title, image } = this.state;

        const isSelected = selected_index === index;
        const stdOption = options[index];

        this.setState({
            selected_index: isSelected ? undefined : index,
            title: isSelected ? undefined : stdOption.title,
            image: isSelected ? undefined : stdOption.image
        });
    }

    onDisorderChange(checked)
    {
        this.state.disorder = checked;
        this.onValueChanged();

        this.setState({});
    }

    render()
    {
        const { disorder, options, selected_index, title, image } = this.state;

        return (
            <div>
                <div className="qitem-single">
                    <div>选项</div>
                    <div className="qradio">
                        <div>
                            {
                                options && options.length ? options.map((ins, i) =>
                                {
                                    return (
                                        <div
                                            key={ i }
                                            className="qradio-option"
                                            data-selected={ selected_index === i ? 1 : 0 }
                                            onClick={ this.onOptionSelected.bind(this, i) }
                                        >
                                            <div className="qradio-no">{ String.fromCharCode(65 + i) }</div>
                                            <div className="qradio-title">{ ins.title }</div>
                                            <div className="qradio-image">
                                                {
                                                    ins.image ? (
                                                        <img src={ ins.image } />) : null
                                                }
                                            </div>
                                            <Icon
                                                className="qradio-right"
                                                data-right={ ins.right }
                                                type="check-circle"
                                                onClick={ this.onRightSelected.bind(this, i) }
                                            />
                                            <div className="qradio-remove">
                                                <Icon
                                                    type="close"
                                                    onClick={ this.onOptionRemoved.bind(this, i) }
                                                />
                                            </div>
                                        </div>
                                    )
                                }) : null
                            }
                        </div>
                        <div>
                            {
                                !options || options.length < 10 ? (
                                    <div className="qradio-append">
                                        <Input.TextArea
                                            rows={ 3 }
                                            autosize={ {
                                                minRows: 3,
                                                maxRows: 3
                                            } }
                                            placeholder="请输入选项文字(必填)"
                                            value={ title }
                                            onChange={ this.onOptionTitleChanged.bind(this) }
                                        />
                                        <PictureUpload
                                            className="qradio-uploader"
                                            value={ image }
                                            description="上传选项图片(可选)"
                                            onCompleted={ this.onUploadCompleted.bind(this) }
                                        />
                                        <Button type="primary" onClick={ this.onAddOption.bind(this) }>{ typeof selected_index !== 'undefined' ? '修改' : '添加' }选项</Button>
                                    </div>
                                ) : null
                            }
                        </div>
                    </div>
                </div>
                <div className="qitem-single">
                    <div>选项乱序</div>
                    <div>
                        <Switch
                            checked={ disorder }
                            onChange={ this.onDisorderChange.bind(this) }
                        />
                    </div>
                </div>
            </div>
        )
    }
}
