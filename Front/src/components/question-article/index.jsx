import React from 'react';
import { Input, message } from 'antd';
import PictureUpload from '../picture-upload';
import { UPLOAD_ADDRESS } from "../../public";
import './index.css';

export default class QuestionArticle extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = QuestionArticle.GetPropsValue(props);
    }

    static GetPropsValue(props)
    {
        const { value } = props;
        return {
            description: value ? value.description : null,
            image: value ? value.image : null
        };
    }

    componentWillReceiveProps(nextProps)
    {
        this.setState(QuestionArticle.GetPropsValue(nextProps));
    }

    onValueChanged()
    {
        const { description, image } = this.state;

        const { onValueChanged } = this.props;
        onValueChanged({
            description: description,
            image: image
        });
    }

    onDescriptionChanged(e)
    {
        this.state.description = e.target.value;
        this.onValueChanged();

        this.setState({});
    }

    onUploadArticleCompleted(err, dat)
    {
        if (err)
        {
            return message.error(err);
        }

        this.state.image = dat;
        this.onValueChanged();

        this.setState({});
    }

    render()
    {
        const { description, image } = this.state;

        return (
            <div>
                <div className="qitem-single">
                    <div>描述</div>
                    <div className="qart-container">
                        <div>
                            <Input.TextArea
                                rows={ 13 }
                                autosize={ {
                                    minRows: 13,
                                    maxRows: 20
                                } }
                                value={ description }
                                placeholder="请输入描述文字(可选)"
                                onChange={ this.onDescriptionChanged.bind(this) }
                            />
                        </div>
                        <PictureUpload
                            value={ image }
                            description="上传描述图片(可选)"
                            onCompleted={ this.onUploadArticleCompleted.bind(this) }
                        />
                    </div>
                </div>
            </div>
        )
    }
}
