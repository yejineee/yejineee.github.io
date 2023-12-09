import { Parent, Node, Literal } from 'unist'
import { visit } from 'unist-util-visit'
import { sync as sizeOf } from 'probe-image-size'
import fs from 'fs'
import { setTree_ } from '@effect-ts/system/Collections/Immutable/HashMap'

export type ImageNode = Parent & {
  url: string
  alt: string
  name: string
  attributes: (Literal & { name: string })[]
}

/**
 * Converts markdown image nodes to next/image jsx.
 *
 */
export function remarkImgToJsx() {
  return (tree: Node) => {
    visit(
      tree,
      // only visit p tags that contain an img element
      (node: Parent): node is Parent =>
        node.type === 'paragraph' && node.children.some((n) => n.type === 'image'),
      (node: Parent) => {
        const imageNodeIndex = node.children.findIndex((n) => n.type === 'image')
        const imageNode = node.children[imageNodeIndex] as ImageNode

        // only local files
        const url = `${process.cwd()}/public/static/images/${decodeURIComponent(imageNode.url)}`
        if (fs.existsSync(url)) {
          const dimensions = sizeOf(fs.readFileSync(url))

          // Convert original node to next/image
          ;(imageNode.type = 'mdxJsxFlowElement'),
            (imageNode.name = 'Image'),
            (imageNode.attributes = [
              { type: 'mdxJsxAttribute', name: 'alt', value: imageNode.alt },
              {
                type: 'mdxJsxAttribute',
                name: 'src',
                value: `/static/images/${decodeURIComponent(imageNode.url)}`,
              },
              { type: 'mdxJsxAttribute', name: 'width', value: dimensions.width },
              { type: 'mdxJsxAttribute', name: 'height', value: dimensions.height },
            ])
          // Change node type from p to div to avoid nesting error
          node.type = 'div'
          node.children[imageNodeIndex] = imageNode
        }
      }
    )
  }
}
