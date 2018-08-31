import React from 'react';
import { Tree } from 'antd';

export default class Categories extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            selected: props.selected,
            tree: props.value
        };
    }

    componentWillReceiveProps(nextProps)
    {
        const { value, selected } = nextProps;
        if (value !== this.state.tree)
        {
            this.setState({
                selected_key: [],
                tree: value
            });
        }
        else if (selected !== this.state.selected)
        {
            this.setState({
                selected: selected
            });
        }
    }

    onSelected(selectedKeys, e)
    {
        let value = null;
        if (e.selected)
        {
            const { id, title, level } = e.selectedNodes[0].props;
            value = {
                id: id,
                name: title,
                level: parseInt(level)
            };
        }

        const onSelect = this.props.onSelect;
        onSelect(value);

        this.setState({
            selected: value
        });
    }

    render()
    {
        const { selected, tree } = this.state;

        const LoopRenderNode = (dat, level) =>
        {
            return !dat || !dat.length ? [] : dat.map((item) => (
                <Tree.TreeNode
                    key={ item.id }
                    id={ item.id }
                    title={ item.name }
                    level={ level }
                >
                    {
                        LoopRenderNode(item.children, level + 1)
                    }
                </Tree.TreeNode>
            ));
        };

        return (
            <div>
                <Tree
                    defaultExpandedKeys={ ['all'] }
                    selectedKeys={ selected ? [selected.id || 'all'] : [] }
                    onSelect={ this.onSelected.bind(this) }
                >
                    <Tree.TreeNode
                        key="all"
                        id={ null }
                        title="全部"
                        level="0"
                    >
                        { LoopRenderNode(tree, 1) }
                    </Tree.TreeNode>
                </Tree>
            </div>
        )
    }
}
