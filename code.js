figma.showUI(__html__, { width: 300, height: 200 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'pixelate') {
    console.log("Pixelate command received");

    const selected = figma.currentPage.selection;
    console.log("Selected elements:", selected);

    if (selected.length === 0) {
      figma.notify("No image selected! Please select an image.");
      return;
    }

    for (const node of selected) {
      console.log("Checking node:", node);

      if (node.type === 'RECTANGLE' && node.fills) {
        const imagePaint = node.fills.find(fill => fill.type === 'IMAGE');

        if (imagePaint) {
          console.log("Image found, sending to UI for processing...");

          const image = figma.getImageByHash(imagePaint.imageHash);
          const bytes = await image.getBytesAsync();
          
          figma.ui.postMessage({
            type: "process-image",
            bytes: bytes,
            pixelSize: msg.pixelSize,
            nodeId: node.id // Sending node ID
          });
        } else {
          figma.notify("Selected rectangle does not contain an image fill.");
        }
      } else {
        figma.notify("Please select a rectangle with an image fill.");
      }
    }
  }
};

figma.ui.onmessage = (msg) => {
  if (msg.type === "processed-image") {
    console.log("Received processed image from UI...");
    
    const selected = figma.currentPage.selection;
    for (const node of selected) {
      if (node.id === msg.nodeId) { // Ensure we're updating the correct node
        console.log("Updating node:", node);

        const newPaint = {
          type: 'IMAGE',
          scaleMode: 'FILL',
          imageHash: figma.createImage(msg.newBytes).hash
        };
        node.fills = [newPaint];
        figma.notify("Pixelation applied!");
      }
    }
  }
};