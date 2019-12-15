// 0.32 -> 32%
export const toPercentage = num => `${num*100}%`

// '100px' -> 100
export const px2number = str => str.replace('px', '') - 0

// 0.2637378 -> 0.26, 8 -> 8
export const toFixed = num => Math.floor(num)===num ? num : num.toFixed(2)

// get sorted four numbers
export const getSortedNumbers = (numbers) =>
  numbers.length!==4 ? [] : [...numbers].sort((a,b) => a - b)

// get middle two from four numbers
export const getEverage = (numbers) =>
  (numbers.reduce((a, b) => a + b, 0))/numbers.length

// get middle two from four numbers
export const getMidNumbers = (numbers) =>
  getSortedNumbers(numbers).slice(1, 3)

// generate box data
export const generateRects = (nodes, docRect) => {
  let index = 0
  const rects = []
  const step = (nodes) => {
    nodes.map(node => {
      const nbb = node.absoluteBoundingBox
      if (node.visible===false) {
        return 1
      } else {
        if (node.type!=='GROUP') {
          const top = (nbb.y - docRect.y)
          const left = (nbb.x - docRect.x)
          const width = nbb.width
          const height = nbb.height
          rects.push({
            index: index++,
            top: top,
            left: left,
            bottom: top+height,
            right: left+width,
            width: width,
            height: height,
            box: {
              top: toPercentage(top/docRect.height),
              left: toPercentage(left/docRect.width),
              bottom: toPercentage((top+height)/docRect.height),
              right: toPercentage((left+width)/docRect.width),
              width: toPercentage(width/docRect.width),
              height: toPercentage(height/docRect.height)
            },
            actualWidth: toFixed(nbb.width),
            actualHeight: toFixed(nbb.height),
            title: node.name,
            clazz: [
              node.type==='COMPONENT' || node.type==='INSTANCE' ? 'component' : ''
            ],
            node
          })
        }
        if (node.children) {
          step(node.children)
        }
        return 1
      }
    })
  }
  step(nodes)
  return rects
}

// selectedRect is clicked box
// targetRect is hovered box
export const isIntersect = (selectedRect, targetRect) => {
  return !(
    selectedRect.right <= targetRect.left ||
    selectedRect.left >= targetRect.right ||
    selectedRect.top >= targetRect.bottom ||
    selectedRect.bottom <= targetRect.top
  )
}

export const getDistance = (selected, target) => {
  return {
    top: (selected.top - target.top),
    right: (target.right - selected.right),
    bottom: (target.bottom - selected.bottom),
    left: (selected.left - target.left)
  }
}

export const getOffset = (selected, target) => {
  return {
    top: target.top - selected.top,
    left: target.left - selected.left,
    bottom: selected.bottom - target.bottom,
    right: selected.right - target.right
  }
}

export const getSpacing = (selected, target) => {
  const spacingV = Math.max(selected.top - target.bottom, target.top - selected.bottom)
  const spacingH = Math.max(selected.left - target.right, target.left - selected.right)
  return {
    // spacing between selected and target in both direction
    spacingV,
    spacingH,
    // selected position(relative to target)
    l: target.left - selected.right>0,
    r: selected.left - target.right>0,
    t: target.top - selected.bottom>0,
    b: selected.top - target.bottom>0
  }
}

// calculate distance data
export const calculateMarkData = (selected, target, pageRect) => {
  // has selected and not the the same
  if (selected && (selected.index !== target.index)){
    const pw = pageRect.width
    const ph = pageRect.height
    const selectedMidX = selected.left + selected.width / 2
    const selectedMidY = selected.top + selected.height / 2
    const targetMidX = target.left + target.width / 2
    const targetMidY = target.top + target.height / 2
    const distanceData = [], rulerData = []
    // not intersect
    if (!isIntersect(selected, target)) {
      const { spacingV, spacingH, l, t, b } = getSpacing(selected, target)
      if (spacingV>0 && spacingH>0) {
        // not intersect in any direction
        distanceData.push({
          x: (l ? selected.right : target.right)/pw,
          y: selectedMidY/ph,
          w: spacingH/pw,
          distance: toFixed(spacingH)
        })
        distanceData.push({
          x: selectedMidX/pw,
          y: (b ? target.bottom : selected.bottom)/ph,
          h: spacingV/ph,
          distance: toFixed(spacingV)
        })
        rulerData.push({
          x: (l ? selectedMidX : target.right)/pw,
          y: (b ? target.bottom : target.top)/ph,
          w: (selected.width/2 + spacingH)/pw,
          distance: toFixed(selected.width/2 + spacingH)
        })
        rulerData.push({
          x: (l ? target.left : target.right)/pw,
          y: (b ? target.bottom : selectedMidY)/ph,
          h: (selected.height/2 + spacingV)/ph,
          distance: toFixed(selected.height/2 + spacingV)
        })
      } else {
        // intersect vertically or horizontally
        const { top, bottom, left, right } = getOffset(selected, target)
        if (spacingV>=0) {
          const sortedNumbers = getSortedNumbers([selected.left, selected.right, target.left, target.right])
          const midNumbers = getMidNumbers([selected.left, selected.right, target.left, target.right])
          if (spacingV!==0) {
            distanceData.push({
              x: (midNumbers[0]+midNumbers[1])/(2*pw),
              y: (top>0 ? selected.bottom : target.bottom)/ph,
              h: spacingV/ph,
              distance: toFixed(spacingV)
            })
          }
          if (left!==0) {
            distanceData.push({
              x: sortedNumbers[0]/pw,
              y: (left>0 ? targetMidY : selectedMidY)/ph,
              w: Math.abs(left)/pw,
              distance: toFixed(Math.abs(left))
            })
            rulerData.push({
              x: sortedNumbers[0]/pw,
              y: ((left>0 && spacingV>0) ? (t ? selected.bottom : targetMidY) : (t ? selectedMidY : target.bottom))/ph,
              h: ((left>0 ? target.height : selected.height)/2 + spacingV)/ph,
              distance: toFixed((left>0 ? target.height : selected.height)/2 + spacingV)
            })
          }
          if (right!==0) {
            distanceData.push({
              x: sortedNumbers[2]/pw,
              y: (right>0 ? targetMidY : selectedMidY)/ph,
              w: Math.abs(right)/pw,
              distance: toFixed(Math.abs(right))
            })
            rulerData.push({
              x: sortedNumbers[3]/pw,
              y: ((right>0 && spacingV>0) ? (t ? selected.bottom : targetMidY) : (t ? selectedMidY : target.bottom))/ph,
              h: ((right>0 ? target.height : selected.height)/2 + spacingV)/ph,
              distance: toFixed((right>0 ? target.height : selected.height)/2 + spacingV)
            })
          }
        }
        if (spacingH>=0) {
          const sortedNumbers = getSortedNumbers([selected.top, selected.bottom, target.top, target.bottom])
          const midNumbers = getMidNumbers([selected.top, selected.bottom, target.top, target.bottom])
          if (spacingH!==0) {
            distanceData.push({
              x: (left>0 ? selected.right : target.right)/pw,
              y: (midNumbers[0]+midNumbers[1])/(2*ph),
              w: spacingH/pw,
              distance: toFixed(spacingH)
            })
          }
          if (top!==0) {
            distanceData.push({
              x: (top>0 ? targetMidX : selectedMidX)/pw,
              y: sortedNumbers[0]/ph,
              h: Math.abs(top)/ph,
              distance: toFixed(Math.abs(top))
            })
            rulerData.push({
              x: (top>0 ? (l ? selected.right : targetMidX) : (l ? selectedMidX : target.right))/pw,
              y: sortedNumbers[0]/ph,
              w: ((top>0 ? target.width : selected.width)/2 + spacingH)/pw,
              distance: toFixed((top>0 ? target.width : selected.width)/2 + spacingH)
            })
          }
          if (bottom!==0) {
            distanceData.push({
              x: (bottom>0 ? targetMidX : selectedMidX)/pw,
              y: sortedNumbers[2]/ph,
              h: Math.abs(bottom)/ph,
              distance: toFixed(Math.abs(bottom))
            })
            rulerData.push({
              x: (bottom>0 ? (l ? selected.right : targetMidX) : (l ? selectedMidX : target.right))/pw,
              y: sortedNumbers[3]/ph,
              w: ((bottom>0 ? target.width : selected.width)/2 + spacingH)/pw,
              distance: toFixed((bottom>0 ? target.width : selected.width)/2 + spacingH)
            })
          }
        }
      }
    } else {
      const sortedVNumbers = getSortedNumbers([selected.top, selected.bottom, target.top, target.bottom])
      const sortedHNumbers = getSortedNumbers([selected.left, selected.right, target.left, target.right])
      const x = getEverage(getMidNumbers(sortedHNumbers))
      const y = getEverage(getMidNumbers(sortedVNumbers))
      if (sortedVNumbers[3] - sortedVNumbers[2]!==0) {
        distanceData.push({
          x: x/pw,
          y: sortedVNumbers[0]/ph,
          h: (sortedVNumbers[1] - sortedVNumbers[0])/ph,
          distance: toFixed(sortedVNumbers[1] - sortedVNumbers[0])
        })
      }
      if (sortedVNumbers[3] - sortedVNumbers[2]!==0) {
        distanceData.push({
          x: x/pw,
          y: sortedVNumbers[2]/ph,
          h: (sortedVNumbers[3] - sortedVNumbers[2])/ph,
          distance: toFixed(sortedVNumbers[3] - sortedVNumbers[2])
        })
      }
      if (sortedHNumbers[1] - sortedHNumbers[0]!==0) {
        distanceData.push({
          x: sortedHNumbers[0]/pw,
          y: y/ph,
          w: (sortedHNumbers[1] - sortedHNumbers[0])/pw,
          distance: toFixed(sortedHNumbers[1] - sortedHNumbers[0])
        })
      }
      if (sortedHNumbers[3] - sortedHNumbers[2]!==0) {
        distanceData.push({
          x: sortedHNumbers[2]/pw,
          y: y/ph,
          w: (sortedHNumbers[3] - sortedHNumbers[2])/pw,
          distance: toFixed(sortedHNumbers[3] - sortedHNumbers[2])
        })
      }
    }
    return {
      distanceData,
      rulerData
    }
  } else {
    return {}
  }
}

// calculate distance data
export const calculateDistance = (selectedRect, targetRect, docRect) => {
  // not the the same
  if (selectedRect && (selectedRect.index !== targetRect.index)){
    const selectedMidX = selectedRect.left + selectedRect.width / 2
    const selectedMidY = selectedRect.top + selectedRect.height / 2
    let topData, rightData, bottomData, leftData
    // not intersect
    if (!isIntersect(selectedRect, targetRect)) {
      //target is on the top of selected
      if(selectedRect.top > targetRect.bottom){
        topData = {
          x: selectedMidX/docRect.width,
          y: targetRect.bottom/docRect.height,
          h: (selectedRect.top - targetRect.bottom)/docRect.height,
          distance: toFixed(selectedRect.top - targetRect.bottom)
        }
      }
      //target is on the right of selected
      if(selectedRect.right < targetRect.left){
        rightData = {
          x: selectedRect.right/docRect.width,
          y: selectedMidY/docRect.height,
          w: (targetRect.left - selectedRect.right)/docRect.width,
          distance: toFixed(targetRect.left - selectedRect.right)
        }
      }
      //target is on the bottom of selected
      if(selectedRect.bottom < targetRect.top){
        bottomData = {
          x: selectedMidX/docRect.width,
          y: selectedRect.bottom/docRect.height,
          h: (targetRect.top - selectedRect.bottom)/docRect.height,
          distance: toFixed(targetRect.top - selectedRect.bottom)
        }
      }
      //target is on the left of selected
      if(selectedRect.left > targetRect.right){
        leftData = {
          x: targetRect.right/docRect.width,
          y: selectedMidY/docRect.height,
          w: (selectedRect.left - targetRect.right)/docRect.width,
          distance: toFixed(selectedRect.left - targetRect.right)
        }
      }
    }
    // intersect
    else {
      const distance = getDistance(selectedRect, targetRect)
      // top
      if (distance.top !== 0) {
        topData = {
          x: selectedMidX/docRect.width,
          y: ((distance.top > 0) ? targetRect.top : selectedRect.top)/docRect.height,
          h: Math.abs(distance.top)/docRect.height,
          distance: toFixed(Math.abs(distance.top))
        }
      }
      // right
      if (distance.right !== 0) {
        rightData = {
          x: ((distance.right > 0) ? selectedRect.right : targetRect.right)/docRect.width,
          y: selectedMidY/docRect.height,
          w: Math.abs(distance.right)/docRect.width,
          distance: toFixed(Math.abs(distance.right))
        }
      }
      // bottom
      if (distance.bottom !== 0) {
        bottomData = {
          x: selectedMidX/docRect.width,
          y: ((distance.bottom > 0) ? selectedRect.bottom : targetRect.bottom)/docRect.height,
          h: Math.abs(distance.bottom)/docRect.height,
          distance: toFixed(Math.abs(distance.bottom))
        }
      }
      // left
      if (distance.left !== 0) {
        leftData = {
          x: ((distance.left > 0) ? targetRect.left : selectedRect.left)/docRect.width,
          y: selectedMidY/docRect.height,
          w: Math.abs(distance.left)/docRect.width,
          distance: toFixed(Math.abs(distance.left))
        }
      }
    }
    return {
      topData,
      rightData,
      bottomData,
      leftData
    }
  } else {
    return {}
  }
}

export const throttle = (fn, delay) => {
 	var timer = null
 	return function(){
 		var context = this, args = arguments;
 		clearTimeout(timer)
 		timer = setTimeout(function(){
 			fn.apply(context, args);
 		}, delay)
 	}
}
