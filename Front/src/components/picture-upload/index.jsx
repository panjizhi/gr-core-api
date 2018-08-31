import React from 'react';
import { Icon, Upload, Modal } from 'antd';
import { UPLOAD_ADDRESS } from "../../public";
import './index.css';

export default class PictureUpload extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            image: props.value,
            description: props.description,
            loading: false
        };
    }

    componentWillReceiveProps(nextProps)
    {
        this.setState({
            image: nextProps.value,
            loading: nextProps.value ? 0 : this.state.loading
        });
    }

    onUploadChanged(info)
    {
        const { file } = info;
        if (file.status === 'uploading')
        {
            this.setState({
                loading: true,
                image: null
            });
        }
        else if (file.status === 'done')
        {
            const rspdt = file.response;
            const dat = rspdt.status ? undefined : rspdt.data[0];

            this.onCompleted(null, dat);

            this.setState({
                loading: false,
                image: dat
            });
        }
        else if (file.status === 'error')
        {
            const { error } = file;

            this.onCompleted(error && error.status === 413 ? '上传的图片太大，请重新选择' : '上传失败，请稍后再试');

            this.setState({
                loading: false,
                image: null
            });
        }
    }

    onCompleted(err, dat)
    {
        const { onCompleted } = this.props;
        onCompleted && onCompleted(err, dat);
    }

    onPreview(e)
    {
        e.stopPropagation();
        this.setState({ visible: true });
    }

    onRemove(e)
    {
        e.stopPropagation();
        this.setState({ image: null });

        this.onCompleted(null, null);
    }

    onAbortPreview()
    {
        this.setState({ visible: false });
    }

    render()
    {
        const { image, loading, description, visible } = this.state;

        return (
            <div className={ this.props.className }>
                <Upload
                    className="pup-container"
                    name="picture"
                    listType="picture-card"
                    showUploadList={ false }
                    action={ UPLOAD_ADDRESS }
                    accept="image/*"
                    onChange={ this.onUploadChanged.bind(this) }
                >
                    {
                        image ? (
                            <div className="upload-container">
                                <div className="upload-mask">
                                    <Icon
                                        type="eye-o"
                                        onClick={ this.onPreview.bind(this) }
                                    />
                                    <Icon
                                        type="delete"
                                        onClick={ this.onRemove.bind(this) }
                                    />
                                </div>
                                <img src={ image } />
                            </div>
                        ) : (
                            <div>
                                <Icon
                                    type={ loading ? 'loading' : 'plus' }
                                    className="upload-icon-plus"
                                />
                                {
                                    description ? (<div className="ant-upload-text">{ description }</div>) : null
                                }
                            </div>
                        )
                    }
                </Upload>
                <Modal
                    visible={ visible }
                    footer={ null }
                    onCancel={ this.onAbortPreview.bind(this) }
                >
                    <img
                        style={
                            { width: '100%' }
                        }
                        src={ image }
                    />
                </Modal>
            </div>
        )
    }
}
