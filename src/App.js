import React, { useState, useEffect, useRef } from "react"

function App() {

  const width = 175
  const limit = 8
  const salt = "ytlas"
  const refs = useRef([])
  const path = window.location.href.substring(0, window.location.href.length - window.location.href.split("/")[window.location.href.split("/").length - 1].length)
  const colors = [["mediumseagreen","purple"],["palevioletred","darkcyan"],["darkgoldenrod","indigo"],["darkkhaki","darkolivegreen"],["slategray","darkslategray"],["crimson","black"]]
  const [currentColor, setCurrentColor] = useState(0)
  const [data, setData] = useState({})
  const [duplicate, setDuplicate] = useState({})
  const [columns, setColumns] = useState({})
  const [selected, setSelected] = useState(null)
  const [image, setImage] = useState(null)
  const [bodyWidth, setBodyWidth] = useState(refs.current["screen"] ? refs.current["screen"].getBoundingClientRect().width : window.innerWidth)
  const [bodyHeight, setBodyHeight] = useState(refs.current["screen"] ? refs.current["screen"].getBoundingClientRect().height : window.innerHeight)
  
  const [zoom, setZoom] = useState(100)
  const [trigger, setTrigger] = useState(0)

  const triggerRerender = () => {
    let zoom = (( window.outerWidth - 10 ) / window.innerWidth) * 100
    setZoom(zoom)
    const rand = Math.random() * Date.now()
    setTrigger(rand)
  }

  useEffect(() => {
    window.addEventListener('resize', triggerRerender)
    return () => {
      window.removeEventListener('resize', triggerRerender)
    }
  }, [])

  const urlType = (url) => {
    if (!url) {
      return "unknown"
    }
    try {
      const valid = new URL(url)
    } catch (error) {
      if (url.match(/iframe/) !== null) {
        const partsOne = url.split('src="')
        if (partsOne.length > 1) {
          const partsTwo = partsOne[1].split('"')
          if (partsTwo.length > 1) {
            return partsTwo[0]
          }
        }
      } else if (url.match(/^.\//) || url.match(/^..\//)) {
        if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/) !== null) {
          return "localimage"
        } else if (url.match(/\.(mp4|webm|mov|ogg)$/) !== null) {
          return "localvideo"
        } else if (url.match(/\.(wav|wave|mp3|aac)$/) !== null) {
          return "localaudio"
        }
      }
      return "unknown"
    }
    if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/) !== null) {
      return "image"
    } else if (url.match(/\.(mp4|webm|mov|ogg)$/) !== null) {
      return "video"
    } else if (url.match(/\.(wav|wave|mp3|aac)$/) !== null) {
      return "audio"
    } else if (url.match(/embed/)) {
      return url
    } else if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)/) !== null) {
      return "image"
    } else if (url.match(/\.(mp4|webm|mov|ogg)/) !== null) {
      return "video"
    } else if (url.match(/\.(wav|wave|mp3|aac)/) !== null) {
      return "audio"
    } else if (url.match(/(www.youtube.com\/watch?)/)) {
      const partsOne = url.split('v=')
      if (partsOne.length > 1) {
        const partsTwo = partsOne[1].split('&')
        if (partsTwo.length > 1) {
          return "https://www.youtube.com/embed/"+partsTwo[0]
        } else {
          return "https://www.youtube.com/embed/"+partsOne[1]
        }
      }
    } else if (url.match(/(youtu.be\/)/)) {
      const partsOne = url.split('youtu.be/')
      if (partsOne.length > 1) {
        return "https://www.youtube.com/embed/"+partsOne[1]
      }
    }
    return "unknown"
  }

  const isValidPath = (string) => {
    if (/^[a-z]:((\\|\/)[a-z0-9\s_@\-^!#$%&+={}\[\]]+)+\.xml$/i.test(string)) {
      return true
    } else {
      return false
    }
  }

  const timestampToDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.getFullYear() + "_" + (date.getMonth() + 1) + "_" + date.getDate() + "_" + date.getHours() + "_" + date.getMinutes()
  }

  const crypt = (salt, text) => {
    const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0))
    const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2)
    const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code)
    return text
      .split("")
      .map(textToChars)
      .map(applySaltToChar)
      .map(byteHex)
      .join("")
  }
  
  const decrypt = (salt, encoded) => {
    const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0))
    const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code)
    return encoded
      .match(/.{1,2}/g)
      .map((hex) => parseInt(hex, 16))
      .map(applySaltToChar)
      .map((charCode) => String.fromCharCode(charCode))
      .join("")
  }

  const toBinary = (text) => {
    const encoder = new TextEncoder()
    return encoder.encode(text)
  }

  const save = () => {
    let filename = refs.current[1].value + "_" + timestampToDate(Date.now()) + ".treemind"
    filename = filename.replaceAll(" ", "_")
    const element = document.createElement('a')
    const text = JSON.stringify({data,color:currentColor})
    const encrypted = crypt(salt, text)
    const bytes = toBinary(encrypted)
    const blob = new Blob([bytes], {type: "application/octet-stream"})
    element.setAttribute('href', URL.createObjectURL(blob))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const open = () => {
    refs.current["input"].click()
  }

  const read = async (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target.result
        const decrypted = decrypt(salt, result)
        const parsed = {...JSON.parse(decrypted)}
        if ("data" in parsed) {
          setData(parsed.data)
          if ("color" in parsed) {
            setCurrentColor(parsed.color)
          }
        } else {
          setData(parsed)
        }
        refs.current["input"].value = null
      }
      reader.readAsBinaryString(new Blob([file]))
    }
  }

  const resetTree = () => {
    setData({1:{links:[], enabled:true, content:"a fresh start"}})
    setSelected(0)
  }

  const insertNode = (toKey) => {
    let increment = 1
    let uid = toKey * 10 + increment
    while (uid in data) {
      increment += 1
      uid = toKey * 10 + increment
    }
    if (parseInt((uid + "").substring((uid + "").length - 1, (uid + "").length)) > limit || (uid + "").substring(0, (uid + "").length - 1) !== toKey) {
      return
    }
    // if (columns[(uid + "").length - 1].length >= limit) {
    //   return
    // }
    data[uid] = {links:[toKey], enabled:false, content:""}
    setData({...data})
    enable(uid)
    setTimeout(() => {refs.current[uid].focus()}, 1)
  }

  const removeNode = (key) => {
    Object.keys(data).forEach(other => {
      if (other in data) {
        const parent = other.substring(0, other.length - 1)
        if (parent === key) {
          removeNode(other)
        }
      }
    })
    delete data[key]
    //setData({...data})
    if (key === selected) {
      setSelected(0)
    }
  }

  const exchange = (keyOne, keyTwo, data) => {
    if (keyOne in data && keyTwo in data) {
      const temp = {...data[keyOne]}
      data[keyOne] = {...data[keyTwo], links:[Math.floor(keyOne * 0.1)]}
      data[keyTwo] = {...temp, links:[Math.floor(keyTwo * 0.1)]}
      const dontDelete = {}
      const copy = {...data}
      Object.keys(data).forEach(key => {
        const stringified = key + ""
        if (stringified !== keyOne + "" && stringified !== keyTwo + "") {
          if (stringified.substring(0, (keyOne + "").length) === keyOne + "") {
            const newKey = parseInt(keyTwo + stringified.substring((keyOne + "").length, stringified.length))
            data[newKey] = {...data[key], links:[Math.floor(newKey * 0.1)]}
            delete data[key]
            dontDelete[newKey] = true
          }
        }
      })
      Object.keys(copy).forEach(key => {
        const stringified = key + ""
        if (stringified !== keyOne + "" && stringified !== keyTwo + "") {
          if (stringified.substring(0, (keyTwo + "").length) === keyTwo + "") {
            const newKey = parseInt(keyOne + stringified.substring((keyTwo + "").length, stringified.length))
            data[newKey] = {...copy[key], links:[Math.floor(newKey * 0.1)]}
            if (!(key in dontDelete)) {
              delete data[key]
            }
          }
        }
      })
    } else if (keyOne in data) {
      data[keyTwo] = {...data[keyOne]}
      delete data[keyOne]
      Object.keys(data).forEach(key => {
        const stringified = key + ""
        if (stringified !== keyOne + "" && stringified !== keyTwo + "") {
          if (stringified.substring(0, (keyOne + "").length) === keyOne + "") {
            const newKey = parseInt(keyTwo + stringified.substring((keyOne + "").length, stringified.length))
            data[newKey] = {...data[key], links:[Math.floor(newKey * 0.1)]}
            delete data[key]
          }
        }
        
      })
    } else if (keyTwo in data) {
      data[keyOne] = {...data[keyTwo]}
      delete data[keyTwo]
      Object.keys(data).forEach(key => {
        const stringified = key + ""
        if (stringified !== keyOne + "" && stringified !== keyTwo + "") {
          if (stringified.substring(0, (keyTwo + "").length) === keyTwo + "") {
            const newKey = parseInt(keyOne + stringified.substring((keyTwo + "").length, stringified.length))
            data[newKey] = {...data[key], links:[Math.floor(newKey * 0.1)]}
            delete data[key]
          }
        }
      })
    }
  }

  const canUp = (key) => {
    const parent = Math.floor(key * 0.1)
    if (parent === 0) {
      return
    }
    const last = key - parent * 10
    let other = null
    let decrement = 1
    while (last - decrement > 0) {
      if (parent * 10 + last - decrement in data) {
        other = parent * 10 + last - decrement
        break
      } else {
        decrement += 1
      }
    }
    return other !== null
  }

  const moveUp = (key) => {
    const parent = Math.floor(key * 0.1)
    if (parent === 0) {
      return false
    }
    const last = key - parent * 10
    let other = null
    let decrement = 1
    while (last - decrement > 0) {
      if (parent * 10 + last - decrement in data) {
        other = parent * 10 + last - decrement
        break
      } else {
        decrement += 1
      }
    }
    if (other !== null) {
      exchange(key, other, data)
      setData({...data})
    }
  }

  const canDown = (key) => {
    const parent = Math.floor(key * 0.1)
    if (parent === 0) {
      return false
    }
    const last = key - parent * 10
    let other = null
    let increment = 1
    while (last + increment < limit + 1) {
      if (parent * 10 + last + increment in data) {
        other = parent * 10 + last + increment
        break
      } else {
        increment += 1
      }
    }
    return other !== null
  }

  const moveDown = (key) => {
    const parent = Math.floor(key * 0.1)
    if (parent === 0) {
      return
    }
    const last = key - parent * 10
    let other = null
    let increment = 1
    while (last + increment < limit + 1) {
      if (parent * 10 + last + increment in data) {
        other = parent * 10 + last + increment
        break
      } else {
        increment += 1
      }
    }
    if (other !== null) {
      exchange(key, other, data)
      setData({...data})
    }
  }

  const autoHeight = (element) => {
    element.style.height = "32px"
    element.style.height = (32 + element.scrollHeight) + "px"
  }

  const setHeights = () => {
    Object.keys(data).forEach(key => {
      autoHeight(refs.current[key])
    })
  }

  const enable = (key) => {
    const copy = {...data}
    Object.keys(copy).forEach(other => {
      copy[other].enabled = false
    })
    copy[key].enabled = true
    let spare = parseInt(key)
    while (spare !== 1 && copy[spare] && copy[spare].links.length > 0) {
      spare = parseInt(copy[spare].links[0])
      copy[spare].enabled = true
    }
    setData({...copy})
  }

  const findCurve = (from, to) => {
    let fromElement = refs.current[from]
    let toElement = refs.current[to]
    if (!fromElement || !toElement) {
      return "M 0 0"
    }
    const fromRectangle = fromElement.getBoundingClientRect()
    const toRectangle = toElement.getBoundingClientRect()
    const fromX = fromRectangle.right - refs.current["screen"].getBoundingClientRect().left - window.scrollX - document.body.getBoundingClientRect().left
    const fromY = fromRectangle.y + fromRectangle.height * 0.5 - refs.current["screen"].getBoundingClientRect().top - window.scrollY - document.body.getBoundingClientRect().top
    const toX = toRectangle.left - refs.current["screen"].getBoundingClientRect().left - window.scrollX - document.body.getBoundingClientRect().left
    const toY = toRectangle.y + toRectangle.height * 0.5 - refs.current["screen"].getBoundingClientRect().top - window.scrollY - document.body.getBoundingClientRect().top
    const middleX = (fromX + toX) * 0.5
    const middleY = (fromY + toY) * 0.5
    const curve = "M " + fromX + " " + fromY + " Q " + ((fromX + middleX) * 0.5) + " " + fromY + " " + middleX + " " + middleY + " T " + toX + " " + toY
    return curve
  }
  
  useEffect(() => {
    if (Object.keys(data).length === 0) {
      const data = {}
      data[1] = {links:[], enabled:true, content:"a fresh start"}
      setData({...data})
      setSelected(0)
    }
  }, [])

  useEffect(() => {
    if (Object.keys(data).length === 0) {
      setColumns({})
      setDuplicate({})
    } else {
      const newColumns = {}
      Object.keys(data).forEach(key => {
        if (!(key.length in newColumns)) {
          newColumns[key.length] = []
        }
        newColumns[key.length].push(key)
      })
      if (JSON.stringify(newColumns) !== JSON.stringify(columns)) {
        setColumns(newColumns)
      }
      setTimeout(() => {setHeights()}, 1)
      if (true || JSON.stringify(duplicate) !== JSON.stringify(data)) {
        setTimeout(() => {
          setDuplicate({...data})
        }, 2)
      }
      setTimeout(() => {
        setBodyWidth(refs.current["screen"] ? refs.current["screen"].getBoundingClientRect().width : window.innerWidth)
        setBodyHeight(refs.current["screen"] ? refs.current["screen"].getBoundingClientRect().height : window.innerHeight)
      }, 3)
    }
    //console.log("data:", data)
  }, [data, trigger])

  return (
    <div style={{minWidth:"100vw", maxWidth:"100vw", maxHeight:"100vh", minHeight:"100vh", margin:"0", padding:"0", color:"white", fontWeight:"bold"}}>
      <input ref={(element) => {refs.current["input"] = element}} type="file" name="choose tree of mind to open" accept=".treemind" style={{display:"none"}} onChange={(e) => {read(e)}} />
      <div style={{backgroundColor:"rgb(30,30,30)", minHeight:"100vh", minWidth:"100vw", position:"fixed"}} />
      {Object.keys(duplicate).map((dataKey, dataIndex) => {
        return (
          <svg key={dataIndex} style={{zIndex:duplicate[dataKey].enabled?2:1, position:"absolute", pointerEvents:"none"}} width={bodyWidth} height={bodyHeight}><path style={{pointerEvents:"auto"}} stroke={duplicate[dataKey].enabled? colors[currentColor][0] : colors[currentColor][1]} opacity={duplicate[dataKey].enabled?"1":"0.5"} strokeWidth="8" fill="none" d={findCurve(dataKey.substring(0, dataKey.length - 1), dataKey)} /></svg>
        )
      })}
      <div ref={(element) => {refs.current["screen"] = element}} style={{zIndex:3, display:"flex", flexDirection:"row", justifyContent:"flex-start", alignItems:"stretch"}}>
        {Object.keys(columns).map((columnKey, columnIndex) => {
          return (
            <div key={columnIndex} style={{display:"flex", flexDirection:"column", justifyContent:"space-evenly", alignItems:"stretch", minHeight:"100vh"}}>
              {columns[columnKey].map((dataKey, rowIndex) => {
                return (
                  <div key={rowIndex} style={{display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", marginRight:"64px", width:width+16+"px"}}>
                    {(dataKey === "1" && data[dataKey] && urlType(data[dataKey].content) === "image") && <div style={{zIndex:4, marginLeft:"72px", marginRight:"8px", minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"black", backgroundPosition:'center', backgroundRepeat:"no-repeat", backgroundSize:'cover', backgroundImage:'url("'+data[dataKey].content+'")', cursor:"pointer"}} onClick={() => {setImage('url("'+data[dataKey].content+'")')}} >
                      <div style={{zIndex:5, position:"absolute", minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"rgba(0,0,0,0.75)", backgroundPosition:'center', backgroundRepeat:"no-repeat", backgroundSize:'contain', backgroundImage:'url("'+data[dataKey].content+'")', cursor:"pointer"}} onClick={() => {setImage('url("'+data[dataKey].content+'")')}} />
                    </div>}
                    {(dataKey === "1" && data[dataKey] && urlType(data[dataKey].content) === "video") && <video style={{zIndex:4, marginLeft:"72px", marginRight:"8px", aspectRatio:1, backgroundColor:"black"}} width={width+"px"} controls ><source src={data[dataKey].content} /></video>}
                    {(dataKey === "1" && data[dataKey] && urlType(data[dataKey].content) === "audio") && <audio style={{zIndex:4, marginLeft:"72px", marginRight:"8px", minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"black"}} controls ><source src={data[dataKey].content} /></audio>}
                    {(dataKey === "1" && data[dataKey] && urlType(data[dataKey].content) === "localimage") && <div style={{zIndex:4, marginLeft:"72px", marginRight:"8px", minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"black", backgroundPosition:'center', backgroundRepeat:"no-repeat", backgroundSize:'cover', backgroundImage:'url("'+path+data[dataKey].content+'")', cursor:"pointer"}} onClick={() => {setImage('url("'+path+data[dataKey].content+'")')}} >
                      <div style={{zIndex:5, position:"absolute", minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"rgba(0,0,0,0.75)", backgroundPosition:'center', backgroundRepeat:"no-repeat", backgroundSize:'contain', backgroundImage:'url("'+path+data[dataKey].content+'")', cursor:"pointer"}} onClick={() => {setImage('url("'+path+data[dataKey].content+'")')}} />
                    </div>}
                    {(dataKey === "1" && data[dataKey] && urlType(data[dataKey].content) === "localvideo") && <video style={{zIndex:4, marginLeft:"72px", marginRight:"8px", aspectRatio:1, backgroundColor:"black"}} width={width+"px"} controls ><source src={path+data[dataKey].content} /></video>}
                    {(dataKey === "1" && data[dataKey] && urlType(data[dataKey].content) === "localaudio") && <audio style={{zIndex:4, marginLeft:"72px", marginRight:"8px", minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"black"}} controls ><source src={path+data[dataKey].content} /></audio>}
                    {(dataKey === "1" && data[dataKey] && !((urlType(data[dataKey].content)).match(/^(unknown|image|video|audio|localimage|localvideo|localaudio)$/))) && <iframe style={{zIndex:4, marginLeft:"72px", marginRight:"8px", minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"black", border:0}} src={urlType(data[dataKey].content)} frameBorder="0" allow="fullscreen; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen={true}></iframe>}
                    {(dataKey !== "1" && data[dataKey] && urlType(data[dataKey].content) === "image") && <div style={{zIndex:4, minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"black", backgroundPosition:'center', backgroundRepeat:"no-repeat", backgroundSize:'cover', backgroundImage:'url("'+data[dataKey].content+'")', cursor:"pointer"}} onClick={() => {setImage('url("'+data[dataKey].content+'")')}} >
                      <div style={{zIndex:5, position:"absolute", minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"rgba(0,0,0,0.75)", backgroundPosition:'center', backgroundRepeat:"no-repeat", backgroundSize:'contain', backgroundImage:'url("'+data[dataKey].content+'")', cursor:"pointer"}} onClick={() => {setImage('url("'+data[dataKey].content+'")')}} />
                    </div>}
                    {(dataKey !== "1" && data[dataKey] && urlType(data[dataKey].content) === "video") && <video style={{zIndex:4, aspectRatio:1, backgroundColor:"black"}} width={width+"px"} controls ><source src={data[dataKey].content} /></video>}
                    {(dataKey !== "1" && data[dataKey] && urlType(data[dataKey].content) === "audio") && <audio style={{zIndex:4, minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"black"}} controls ><source src={data[dataKey].content} /></audio>}
                    {(dataKey !== "1" && data[dataKey] && urlType(data[dataKey].content) === "localimage") && <div style={{zIndex:4, minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"black", backgroundPosition:'center', backgroundRepeat:"no-repeat", backgroundSize:'cover', backgroundImage:'url("'+path+data[dataKey].content+'")', cursor:"pointer"}} onClick={() => {setImage('url("'+path+data[dataKey].content+'")')}} >
                      <div style={{zIndex:5, position:"absolute", minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"rgba(0,0,0,0.75)", backgroundPosition:'center', backgroundRepeat:"no-repeat", backgroundSize:'contain', backgroundImage:'url("'+path+data[dataKey].content+'")', cursor:"pointer"}} onClick={() => {setImage('url("'+path+data[dataKey].content+'")')}} />
                    </div>}
                    {(dataKey !== "1" && data[dataKey] && urlType(data[dataKey].content) === "localvideo") && <video style={{zIndex:4, aspectRatio:1, backgroundColor:"black"}} width={width+"px"} controls ><source src={path+data[dataKey].content} /></video>}
                    {(dataKey !== "1" && data[dataKey] && urlType(data[dataKey].content) === "localaudio") && <audio style={{zIndex:4, minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"black"}} controls ><source src={path+data[dataKey].content} /></audio>}
                    {(dataKey !== "1" && data[dataKey] && !((urlType(data[dataKey].content)).match(/^(unknown|image|video|audio|localimage|localvideo|localaudio)$/))) && <iframe style={{zIndex:4, minWidth:width+"px", maxWidth:width+"px", aspectRatio:1, backgroundColor:"black", border:0}} src={urlType(data[dataKey].content)} frameBorder="0" allow="fullscreen; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen={true}></iframe>}
                    <div key={rowIndex} style={{display:"flex", flexDirection:"row", justifyContent:"center", alignItems:"center"}}>
                      {(dataKey === "1") && <div style={{zIndex:5, cursor:"pointer", marginLeft:"64px", minWidth:"8px", minHeight:"calc(100% - 8px)", borderBottomLeftRadius:"999px", borderTopLeftRadius:"999px", backgroundColor:"white"}} onClick={() => {resetTree()}} />}
                      {(dataKey !== "1") && <div style={{zIndex:5, cursor:"pointer", minWidth:"8px", minHeight:"8px", height:"unset", borderRadius:"999px", backgroundColor:"white"}} onClick={() => {removeNode(dataKey); setData({...data})}} />}
                      {/* <textarea ref={(element) => {refs.current[dataKey] = element}} style={{zIndex:4, fontWeight:"bold", minWidth:width+"px", maxWidth:width+"px", resize:"none", overflow:"hidden", color:"white", fontWeight:"bold", margin:"4px 0px 4px 0px", padding:"0px 4px", backgroundColor:data[dataKey]?.enabled? colors[currentColor][0] : colors[currentColor][1], border:data[dataKey]?.enabled? "8px solid "+colors[currentColor][0] : "8px solid "+colors[currentColor][1], borderRadius:"0px"}} value={dataKey+" "+data[dataKey]?.content || ""} onClick={() => {enable(dataKey)}} onChange={(e) => {if (data[dataKey]) {data[dataKey].content = e.target.value; setData({...data}); autoHeight(e.target)}}} /> */}
                      <textarea ref={(element) => {refs.current[dataKey] = element}} style={{zIndex:4, fontWeight:"bold", minWidth:width+"px", maxWidth:width+"px", resize:"none", overflow:"hidden", color:"white", fontWeight:"bold", margin:"4px 0px 4px 0px", padding:"0px 4px", backgroundColor:data[dataKey]?.enabled? colors[currentColor][0] : colors[currentColor][1], border:data[dataKey]?.enabled? "8px solid "+colors[currentColor][0] : "8px solid "+colors[currentColor][1], borderRadius:"0px"}} value={data[dataKey]?.content || ""} onClick={() => {enable(dataKey)}} onChange={(e) => {if (data[dataKey]) {data[dataKey].content = e.target.value; setData({...data}); autoHeight(e.target)}}} />
                      <div style={{display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", marginLeft:"-3px"}}>
                        {canUp(dataKey) ? <div style={{zIndex:5, cursor:"pointer"}} onClick={() => {moveUp(dataKey)}}>&#9652;</div> : <div>&#9652;</div>}
                        <div style={{zIndex:5, cursor:"pointer", minWidth:"8px", minHeight:"8px", borderRadius:"999px", backgroundColor:"white"}} onClick={() => {insertNode(dataKey)}} />
                        {canDown(dataKey) ? <div style={{zIndex:5, cursor:"pointer"}} onClick={() => {moveDown(dataKey)}}>&#9662;</div> : <div>&#9662;</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      {image !== null && <div style={{zIndex:10, cursor:"pointer", position:"fixed", left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:"100vw", height:"100vh", backgroundColor:"rgba(0,0,0,0.75)", backgroundPosition:'center', backgroundRepeat:"no-repeat", backgroundSize:'contain', backgroundImage:image}} onClick={() => {setImage(null)}} />}
      <div style={{zIndex:9, transformOrigin:"left bottom", transform:"scale("+100/zoom+")", position:"fixed", left:"0", bottom:"0", display:"flex", flexDirection:"row", justifyContent:"flex-start", alignItems:"center", margin:"4px 0px 4px 0px", padding:"0px 4px", borderRadius:"0px", minWidth:"120px"}}>
        <svg style={{zIndex:9, cursor:"pointer", margin:"4px"}} fill="white" width="32px" height="32px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" onClick={() => {open()}}><path d="M147.8 192H480V144C480 117.5 458.5 96 432 96h-160l-64-64h-160C21.49 32 0 53.49 0 80v328.4l90.54-181.1C101.4 205.6 123.4 192 147.8 192zM543.1 224H147.8C135.7 224 124.6 230.8 119.2 241.7L0 480h447.1c12.12 0 23.2-6.852 28.62-17.69l96-192C583.2 249 567.7 224 543.1 224z"/></svg>
        <svg style={{zIndex:9, cursor:"pointer", margin:"4px", marginRight:"32px"}}  fill="white" width="32px" height="32px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" onClick={() => {save()}}><path d="M433.1 129.1l-83.9-83.9C342.3 38.32 327.1 32 316.1 32H64C28.65 32 0 60.65 0 96v320c0 35.35 28.65 64 64 64h320c35.35 0 64-28.65 64-64V163.9C448 152.9 441.7 137.7 433.1 129.1zM224 416c-35.34 0-64-28.66-64-64s28.66-64 64-64s64 28.66 64 64S259.3 416 224 416zM320 208C320 216.8 312.8 224 304 224h-224C71.16 224 64 216.8 64 208v-96C64 103.2 71.16 96 80 96h224C312.8 96 320 103.2 320 112V208z"/></svg>
        {colors.map((value, index) => {
          return (
            <div key={index} style={{zIndex:9, cursor:"pointer", minWidth:"32px", minHeight:"32px", maxWidth:"32px", maxHeight:"32px", margin:"4px", backgroundImage:"linear-gradient(135deg,"+value[0]+","+value[1]+")", borderRadius:"8px", border:index===currentColor?"3px solid white":"3px solid dimgray"}} onClick={() => {setCurrentColor(parseInt(index))}}></div>
          )
        })}
      </div>
      <div style={{zIndex:9, transformOrigin:"right bottom", transform:"scale("+100/zoom+")", position:"fixed", right:"0", bottom:"0", display:"flex", flexDirection:"row", justifyContent:"space-evenly", alignItems:"center", margin:"4px 0px 4px 0px", padding:"0px 4px", borderRadius:"0px", minWidth:"120px", fontSize:"small"}}>TreeMinder v1.0</div>
    </div>
  )
}

export default App
