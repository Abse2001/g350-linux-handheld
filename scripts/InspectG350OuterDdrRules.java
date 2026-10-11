import java.io.*;
import java.nio.file.*;
import java.util.*;
import app.freerouting.core.RoutingJob;
import app.freerouting.management.HeadlessBoardManager;
import app.freerouting.board.state.BoardObserverAdaptor;
import app.freerouting.board.actions.ItemIdGenerator;
import app.freerouting.drc.ClearanceViolation;
import app.freerouting.geometry.planar.FloatPoint;
import app.freerouting.board.model.items.Pin;
import com.google.gson.GsonBuilder;

/** Read-only diagnostic: imported clearances, violations and physical pins. */
public class InspectG350OuterDdrRules {
  private static List<String> netNames(app.freerouting.board.model.items.Item item,app.freerouting.board.facade.BasicBoard board){var names=new ArrayList<String>();for(int i=0;i<item.netCount();i++)names.add(board.rules.nets.get(item.getNetNumber(i)).name);return names;}
  public static void main(String[] args) throws Exception {
    var job=new RoutingJob();job.setInput(new File(args[0]));
    var manager=new HeadlessBoardManager(job);
    try(var stream=new FileInputStream(args[0])){manager.loadFromSpecctraDsn(stream,new BoardObserverAdaptor(),new ItemIdGenerator());}
    var board=manager.getRoutingBoard();if(board==null)throw new IllegalStateException("No board");board.awaitPostLoad();
    var transform=board.communication.coordinateTransform;
    double origin=transform.boardToDsn(new FloatPoint(0,0))[0];
    var cm=board.rules.clearanceMatrix;var matrix=new ArrayList<Map<String,Object>>();
    for(int i=0;i<cm.getClassCount();i++)for(int j=0;j<cm.getClassCount();j++){
      int value=cm.getValue(i,j,0,false);matrix.add(Map.of("first",cm.getName(i),"second",cm.getName(j),"clearanceUm",transform.boardToDsn(new FloatPoint(value,0))[0]-origin));
    }
    var violations=ClearanceViolation.aggregateSortedBySeverity(board.getItems());var examples=new ArrayList<Map<String,Object>>();
    for(var v:violations.subList(0,Math.min(12,violations.size()))){examples.add(Map.of("firstNets",netNames(v.firstItem,board),"secondNets",netNames(v.secondItem,board),"firstId",v.firstItem.getId(),"secondId",v.secondItem.getId(),"firstClass",cm.getName(v.firstItem.clearanceClassIndex()),"secondClass",cm.getName(v.secondItem.clearanceClassIndex()),"layer",v.layer,"expectedUm",transform.boardToDsn(new FloatPoint(v.expectedClearance,0))[0]-origin,"actualUm",transform.boardToDsn(new FloatPoint(v.actualClearance,0))[0]-origin));}
    var focused=new ArrayList<Map<String,Object>>();
    for(var v:violations)if((v.firstItem.getId()==6438 && v.secondItem.getId()==5533)||(v.firstItem.getId()==6204 && v.secondItem.getId()==6179))focused.add(Map.of("firstNets",netNames(v.firstItem,board),"secondNets",netNames(v.secondItem,board),"expectedUm",transform.boardToDsn(new FloatPoint(v.expectedClearance,0))[0]-origin,"actualUm",transform.boardToDsn(new FloatPoint(v.actualClearance,0))[0]-origin,"layer",v.layer));
    var pins=new ArrayList<Map<String,Object>>();
    for(var item:board.getItems())if(item instanceof Pin pin){var p=transform.boardToDsn(pin.getCenter().toFloat());pins.add(Map.of("reference",board.components.get(pin.getComponentId()).name,"pin",pin.name(),"xUm",p[0],"yUm",p[1],"firstLayer",pin.firstLayer(),"lastLayer",pin.lastLayer()));}
    var report=Map.of("clearanceMatrix",matrix,"violations",violations.size(),"examples",examples,"focused",focused,"pins",pins,"readOnly",true,"fabricationReady",false);
    Files.writeString(Path.of(args[1]),new GsonBuilder().setPrettyPrinting().create().toJson(report)+"\n");
    System.out.println("Read-only imported rules: "+violations.size()+" violations, "+pins.size()+" pins");
  }
}
