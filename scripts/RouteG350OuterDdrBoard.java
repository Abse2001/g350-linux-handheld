import java.io.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import app.freerouting.core.RoutingJob;
import app.freerouting.core.StoppableThread;
import app.freerouting.management.HeadlessBoardManager;
import app.freerouting.board.state.BoardObserverAdaptor;
import app.freerouting.board.actions.ItemIdGenerator;
import app.freerouting.autoroute.pipeline.RoutingPipeline;
import app.freerouting.settings.sources.DefaultSettings;
import com.google.gson.GsonBuilder;

/** Bounded additional planner. All locked geometry and check rules are retained. */
public class RouteG350OuterDdrBoard {
  public static void main(String[] args) throws Exception {
    if (args.length != 3) throw new IllegalArgumentException("INPUT.dsn NEW_ROOT SECONDS");
    var root = Path.of(args[1]); Files.createDirectory(root);
    int seconds = Integer.parseInt(args[2]);
    if (seconds < 30 || seconds > 900) throw new IllegalArgumentException("Budget 30..900s");
    var gson = new GsonBuilder().setPrettyPrinting().create();
    var job = new RoutingJob(); job.setInput(new File(args[0]));
    // The low-level API uses sparse nullable settings; the normal CLI merges
    // the same official defaults before constructing a routing pipeline.
    job.routerSettings = new DefaultSettings().getSettings();
    var manager = new HeadlessBoardManager(job);
    try (var stream = new FileInputStream(args[0])) {
      manager.loadFromSpecctraDsn(stream, new BoardObserverAdaptor(), new ItemIdGenerator());
    }
    job.board = manager.getRoutingBoard();
    if (job.board == null) throw new IllegalStateException("DSN failed to load");
    job.board.awaitPostLoad();
    int ddrNetCount = 0;
    for (int i = 1; i <= job.board.rules.nets.maxNetNumber(); i++) {
      var net = job.board.rules.nets.get(i);
      if (net == null) continue;
      var nc = net.getNetClass();
      boolean ddr = nc.getName().contains("_DDR_outer");
      nc.isIgnoredByAutorouter = !ddr;
      if (ddr) {
        if (nc.layerCount() != 4) throw new IllegalStateException("Physical board must stay four layers");
        for (int l=0; l<4; l++) nc.setActiveRoutingLayer(l, l==0 || l==3);
        ddrNetCount++;
      }
    }
    if (ddrNetCount != 49) throw new IllegalStateException("Expected49 DDR nets, found " + ddrNetCount);
    var settings = job.routerSettings;
    settings.fanout.enabled = false;
    settings.fanout.maxPasses = 2;
    settings.fanout.maxMillisecondsPerPin = 100L;
    settings.fanout.startViaDiameterMm = 0.4572;
    settings.fanout.endViaDiameterMm = 0.4572;
    settings.fanout.minEscapeLengthMm = 0.25;
    settings.fanout.maxEscapeLengthMm = 1.5;
    settings.autorouter.enabled = true;
    settings.autorouter.maxPasses = 8;
    settings.autorouter.maxThreads = 1;
    settings.optimizer.enabled = false;
    settings.maxThreads = 1;
    settings.automaticNeckdown = false;
    settings.copperToEdgeClearanceUm = 300.0;
    settings.holeClearanceUm = 200.0;
    settings.validateAgainstBoard(job.board);
    Files.writeString(root.resolve("settings.json"), gson.toJson(settings)+"\n");
    var failure = new Throwable[1];
    job.startedAt = Instant.now();
    job.thread = new StoppableThread() {
      protected void threadAction() {
        try { RoutingPipeline.createForHeadless(job).run(); }
        catch (Throwable e) { failure[0] = e; }
      }
    };
    job.thread.start(); job.thread.join(seconds * 1000L);
    boolean budgetReached = job.thread.isAlive();
    if (budgetReached) { job.thread.requestStop(); job.thread.join(30000L); }
    if (job.thread.isAlive()) throw new IllegalStateException("Planner did not stop; no concurrent export");
    if (failure[0] != null) throw new RuntimeException("Planner failed", failure[0]);
    manager.replaceRoutingBoard(job.board);
    try (var stream = Files.newOutputStream(root.resolve("routed.ses"))) {
      if (!manager.saveAsSpecctraSessionSes(stream, new File(args[0]).getName())) throw new IOException("SES export failed");
    }
    var result = new LinkedHashMap<String,Object>();
    result.put("input", args[0]); result.put("budgetSeconds", seconds);
    result.put("budgetReached", budgetReached); result.put("actualPass",job.getCurrentPass());
    result.put("elapsedSeconds",Duration.between(job.startedAt,Instant.now()).toMillis()/1000.0);
    result.put("ddrNetCount",ddrNetCount); result.put("ddrLayers",List.of("F.Cu","B.Cu")); result.put("allOtherNetsIgnoredByAutorouter",true); result.put("matchingSourceAndCadUnqualified",true); result.put("planningOnly",true); result.put("fabricationReady",false);
    Files.writeString(root.resolve("execution.json"),gson.toJson(result)+"\n");
    System.out.println(gson.toJson(result));
  }
}
