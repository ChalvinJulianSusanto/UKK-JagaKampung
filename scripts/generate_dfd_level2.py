import xml.etree.ElementTree as ET
from xml.dom import minidom
import os

def create_drawio_xml(diagram_name, processes, stores, entities, flows, title_text):
    """
    Generate Draw.io XML for DFD Level 2 with auto-layout logic
    to prevent overlapping.
    """
    # Root structure
    root = ET.Element('mxfile', host="Electron", agent="Antigravity", version="24.0.0", type="device")
    diagram = ET.SubElement(root, 'diagram', id=f"dfd2-{diagram_name.lower()}", name=f"DFD Level 2 - {diagram_name}")
    mxGraphModel = ET.SubElement(diagram, 'mxGraphModel', dx="1422", dy="800", grid="1", gridSize="10", 
                                guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", 
                                pageScale="1", pageWidth="2000", pageHeight="1500", math="0", shadow="0")
    
    root_cell = ET.SubElement(mxGraphModel, 'root')
    ET.SubElement(root_cell, 'mxCell', id="0")
    ET.SubElement(root_cell, 'mxCell', id="1", parent="0")
    
    # Title
    ET.SubElement(root_cell, 'mxCell', id="title", value=title_text, 
                 style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=20;fontStyle=1;", 
                 vertex="1", parent="1").append(
                     ET.Element('mxGeometry', x="600", y="50", width="600", height="40", as_="geometry")
                 )

    # Styles
    style_process = "ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;strokeWidth=2;fontSize=12;"
    style_entity = "rounded=0;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;strokeWidth=2;fontSize=13;fontStyle=1;"
    style_store = "shape=partialRectangle;whiteSpace=wrap;html=1;left=0;right=0;fillColor=#f5f5f5;strokeColor=#666666;fontSize=12;"
    
    # Layout Constants
    LEFT_X = 150
    RIGHT_X = 1450
    CENTER_START_X = 500
    CENTER_GAP_X = 350
    ROW_Y_START = 300
    ROW_GAP_Y = 250
    STORE_Y_OFFSET = -120  # Store di atas proses
    
    # Place Entities (Left & Right)
    for i, entity in enumerate(entities):
        x_pos = LEFT_X if entity['side'] == 'left' else RIGHT_X
        # Distribute vertically
        y_pos = ROW_Y_START + (i * 200) % 600 
        
        ET.SubElement(root_cell, 'mxCell', id=entity['id'], value=entity['label'], 
                     style=style_entity, vertex="1", parent="1").append(
                         ET.Element('mxGeometry', x=str(x_pos), y=str(y_pos), width="140", height="70", as_="geometry")
                     )

    # Place Processes (Center Grid)
    # Grid 3x2 or 4x2
    for i, proc in enumerate(processes):
        col = i % 3
        row = i // 3
        x_pos = CENTER_START_X + (col * CENTER_GAP_X)
        y_pos = ROW_Y_START + (row * ROW_GAP_Y)
        
        ET.SubElement(root_cell, 'mxCell', id=proc['id'], value=proc['label'], 
                     style=style_process, vertex="1", parent="1").append(
                         ET.Element('mxGeometry', x=str(x_pos), y=str(y_pos), width="130", height="100", as_="geometry")
                     )
        
        # Place related Data Store above/below process if specified
        if 'store' in proc:
            store = proc['store']
            store_y = y_pos + STORE_Y_OFFSET
            ET.SubElement(root_cell, 'mxCell', id=store['id'], value=store['label'], 
                         style=style_store, vertex="1", parent="1").append(
                             ET.Element('mxGeometry', x=str(x_pos), y=str(store_y), width="130", height="40", as_="geometry")
                         )
            
            # Auto Connect Store <-> Process
            connect(root_cell, store['id'], proc['id'], "dashed=1;endArrow=classic;")
            connect(root_cell, proc['id'], store['id'], "dashed=1;endArrow=classic;")

    # Process Flows
    for flow in flows:
        style = "endArrow=classic;html=1;strokeWidth=1.5;"
        if flow.get('dashed'): style += "dashed=1;"
        if flow.get('curved'): style += "curved=1;"
        
        edge = ET.SubElement(root_cell, 'mxCell', id=f"flow_{flow['src']}_{flow['target']}", 
                            value=flow['label'], style=style, edge="1", parent="1", 
                            source=flow['src'], target=flow['target'])
        edge.append(ET.Element('mxGeometry', relative="1", as_="geometry"))

    return prettify(root)

def connect(root_cell, src, target, style_extra=""):
    style = "endArrow=classic;html=1;strokeWidth=1.5;" + style_extra
    edge = ET.SubElement(root_cell, 'mxCell', id=f"conn_{src}_{target}", value="", 
                        style=style, edge="1", parent="1", source=src, target=target)
    edge.append(ET.Element('mxGeometry', relative="1", as_="geometry"))

def prettify(elem):
    rough_string = ET.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")

# ================= DEFINISI DATA =================

# 1. JADWAL (Schedule)
def generate_schedule_dfd():
    entities = [
        {'id': 'admin', 'label': 'Admin', 'side': 'left'},
        {'id': 'user', 'label': 'User/Warga', 'side': 'right'}, # For notification
        {'id': 'rt', 'label': 'Ketua RT', 'side': 'right'}
    ]
    
    processes = [
        {'id': 'p21', 'label': '2.1\nBuat Wadah\nJadwal (Bulan/RT)', 'store': {'id': 'ds2a', 'label': 'D2 | Schedule'}},
        {'id': 'p22', 'label': '2.2\nTambah Petugas\nke Jadwal (Entry)', 'store': {'id': 'ds1', 'label': 'D1 | User'}},
        {'id': 'p23', 'label': '2.3\nValidasi\nTanggal & Hari'},
        {'id': 'p24', 'label': '2.4\nKirim Notifikasi\nJadwal', 'store': {'id': 'ds8', 'label': 'D8 | Notification'}},
        {'id': 'p25', 'label': '2.5\nUpdate/Hapus\nJadwal Petugas'},
        {'id': 'p26', 'label': '2.6\nLihat Partner\nJaga Hari Ini'}
    ]
    
    flows = [
        # Admin creates schedule container
        {'src': 'admin', 'target': 'p21', 'label': 'data bulan/tahun'},
        {'src': 'p21', 'target': 'p22', 'label': 'schedule ID'},
        
        # Add Entry
        {'src': 'admin', 'target': 'p22', 'label': 'input petugas'},
        {'src': 'p22', 'target': 'p23', 'label': 'data entry'},
        {'src': 'p23', 'target': 'p22', 'label': 'valid data'},
        
        # Save Entry & Notify
        {'src': 'p22', 'target': 'ds2a', 'label': 'update entries', 'dashed': True},
        {'src': 'p22', 'target': 'p24', 'label': 'trigger notif'},
        {'src': 'p24', 'target': 'user', 'label': 'email/notif', 'curved': True},
        
        # Edit/Delete
        {'src': 'admin', 'target': 'p25', 'label': 'edit request'},
        {'src': 'p25', 'target': 'ds2a', 'label': 'update', 'dashed': True},
        
        # View Partner
        {'src': 'user', 'target': 'p26', 'label': 'req partner info'},
        {'src': 'ds2a', 'target': 'p26', 'label': 'read today', 'dashed': True},
        {'src': 'p26', 'target': 'user', 'label': 'partner list'},
        
        # RT Access
        {'src': 'rt', 'target': 'p21', 'label': 'view schedule'},
    ]
    
    return create_drawio_xml("Jadwal", processes, [{**p['store']} for p in processes if 'store' in p], entities, flows, "DFD Level 2 - Proses 2: Manajemen Jadwal")

# 2. KEGIATAN (Activity)
def generate_activity_dfd():
    entities = [
        {'id': 'admin', 'label': 'Admin', 'side': 'left'},
        {'id': 'warga', 'label': 'Warga', 'side': 'right'}
    ]
    
    processes = [
        {'id': 'p41', 'label': '4.1\nBuat Kegiatan\nBaru', 'store': {'id': 'ds4a', 'label': 'D4 | Activity'}},
        {'id': 'p42', 'label': '4.2\nUpload Banner\nKegiatan'},
        {'id': 'p43', 'label': '4.3\nUpload\nDokumentasi', 'store': {'id': 'ds4b', 'label': 'D4 | Activity'}}, # Same store logically
        {'id': 'p44', 'label': '4.4\nTampilkan Feed\nKegiatan'},
        {'id': 'p45', 'label': '4.5\nFilter Konten\n(>7 Hari)'},
        {'id': 'p46', 'label': '4.6\nProses Validasi\nRT/Lokasi'}
    ]
    
    flows = [
        # Create Activity
        {'src': 'admin', 'target': 'p41', 'label': 'data kegiatan'},
        {'src': 'p41', 'target': 'p46', 'label': 'raw data'},
        {'src': 'p46', 'target': 'p41', 'label': 'validated'},
        {'src': 'p41', 'target': 'p42', 'label': 'activity created'},
        {'src': 'admin', 'target': 'p42', 'label': 'upload banner'},
        {'src': 'p42', 'target': 'ds4a', 'label': 'save path', 'dashed': True},
        
        # Documentation
        {'src': 'admin', 'target': 'p43', 'label': 'foto dokumentasi'},
        {'src': 'p43', 'target': 'ds4b', 'label': 'append docs', 'dashed': True},
        
        # Feed & Display
        {'src': 'warga', 'target': 'p44', 'label': 'buka menu kegiatan'},
        {'src': 'ds4a', 'target': 'p44', 'label': 'fetch all', 'dashed': True},
        {'src': 'p44', 'target': 'p45', 'label': 'filter logic'},
        {'src': 'p45', 'target': 'p44', 'label': 'filtered data'},
        {'src': 'p44', 'target': 'warga', 'label': 'list activities'},
        
        # Notif trigger (Implicit to P7 but handled here simpler)
        {'src': 'p41', 'target': 'warga', 'label': 'new activity info', 'curved': True, 'dashed': True}
    ]
    
    return create_drawio_xml("Kegiatan", processes, [], entities, flows, "DFD Level 2 - Proses 4: Manajemen Kegiatan")


# Main Execution
if __name__ == "__main__":
    output_dir = "c:/Users/user/Desktop/JagaKampung/docs"
    
    # 1. Generate Jadwal
    xml_jadwal = generate_schedule_dfd()
    with open(f"{output_dir}/JagaKampung_DFD_Level2_Jadwal.drawio", "w", encoding='utf-8') as f:
        f.write(xml_jadwal)
    print("✅ Generated JagaKampung_DFD_Level2_Jadwal.drawio")
        
    # 2. Generate Kegiatan
    xml_kegiatan = generate_activity_dfd()
    with open(f"{output_dir}/JagaKampung_DFD_Level2_Kegiatan.drawio", "w", encoding='utf-8') as f:
        f.write(xml_kegiatan)
    print("✅ Generated JagaKampung_DFD_Level2_Kegiatan.drawio")
